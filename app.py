from flask import Flask, render_template, request, redirect, url_for, jsonify, session, send_file
import re
import os
from io import BytesIO
from fpdf import FPDF

app = Flask(__name__, static_folder='static', template_folder='templates')

app.secret_key = 'your_secret_key'  
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def process_pbn(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    boards = []
    all_card_tracking = {}

    dealer_order = {
        'N': ['N', 'E', 'S', 'W'],
        'E': ['E', 'S', 'W', 'N'],
        'S': ['S', 'W', 'N', 'E'],
        'W': ['W', 'N', 'E', 'S']
    }

    board_matches = re.findall(r'\[Board "(\d+)"\](.*?)\[OptimumResultTable', content, re.DOTALL)

    for match in board_matches:
        board_number = int(match[0])
        board_data = match[1]

        dealer_match = re.search(r'\[Dealer "(.*?)"\]', board_data)
        deal_match = re.search(r'\[Deal "(.*?)"\]', board_data)

        if not dealer_match or not deal_match:
            continue

        dealer = dealer_match.group(1)
        deal = deal_match.group(1)

        order = dealer_order[dealer]

        raw_deal = re.sub(r'[NESW]:', '', deal).split()
        ordered_deal = {order[i]: raw_deal[i] for i in range(4)}

        suits = {'C': 'Clubs', 'D': 'Diamonds', 'H': 'Hearts', 'S': 'Spades'}
        parsed_hands = {d: {s: [] for s in suits} for d in order}

        for direction in order:
            hand = ordered_deal[direction]
            suit_cards = hand.split('.')
            for suit, cards in zip(suits.keys(), suit_cards):
                parsed_hands[direction][suit] = list(cards.strip())
                for rank in cards.strip():
                    card_key = f"{suit}{rank}"
                    if card_key not in all_card_tracking:
                        all_card_tracking[card_key] = ""
                    all_card_tracking[card_key] += direction

        boards.append({
            'board_number': board_number,
            'dealer': dealer,
            'hands': parsed_hands
        })

    return boards, all_card_tracking

@app.route('/', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file part'})
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No selected file'})
        
        if file and file.filename.endswith('.pbn'):
            filename = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(filename)
            
            boards, all_card_tracking = process_pbn(filename)
            
            session['boards'] = boards
            session['all_card_tracking'] = all_card_tracking
            
            return jsonify({
                'success': True,
                'redirect_url': url_for('convert_page')
            })

    return render_template('index.html') 

@app.route('/convert')
def convert_page():
    boards = session.get('boards', None)
    all_card_tracking = session.get('all_card_tracking', None)
    
    if boards is None or all_card_tracking is None:
        return redirect(url_for('upload_file')) 
    
    return render_template('convert.html', boards=boards, all_card_tracking=all_card_tracking)

@app.route('/card')
def card():
    return render_template('card.html')

if __name__ == '__main__':
    app.run(debug=True)
