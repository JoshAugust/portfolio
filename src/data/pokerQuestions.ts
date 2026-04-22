export interface PokerOption {
  text: string;
  correct: boolean;
}

export interface PokerQuestion {
  id: number;
  type: 'which_hand_wins' | 'right_play';
  title: string;
  scenario: string;
  players?: {
    player_a?: string;
    player_b?: string;
    you?: string;
    opponent?: string;
  };
  options: PokerOption[];
  explanation: string;
  source: string;
}

export const practiceQuestions: PokerQuestion[] = [
  {
    id: 101,
    type: 'which_hand_wins',
    title: 'Practice — Pair vs. Two Pair',
    scenario: 'The board shows: 3♠ 7♦ T♣ K♥ 2♦',
    players: {
      player_a: 'K♠ 9♣ (Pair of Kings)',
      player_b: 'T♠ 7♣ (Two Pair — Tens and Sevens)',
    },
    options: [
      { text: 'Player A wins — Kings are the highest pair', correct: false },
      { text: 'Player B wins — two pair beats one pair', correct: true },
      { text: 'Split pot — both have strong hands', correct: false },
      { text: 'Player A wins — they have the best kicker', correct: false },
    ],
    explanation:
      'Two pair always beats one pair, regardless of the ranks. Player B\'s Tens and Sevens (two pair) beats Player A\'s Kings (one pair). Hand rankings: High Card < One Pair < Two Pair < Three of a Kind < Straight < Flush < Full House < Four of a Kind < Straight Flush.',
    source: 'Practice question',
  },
  {
    id: 102,
    type: 'which_hand_wins',
    title: 'Practice — Flush vs. Straight',
    scenario: 'The board shows: 4♥ 8♥ J♥ 3♠ 6♦',
    players: {
      player_a: 'A♥ 2♥ (Heart Flush)',
      player_b: '5♠ 7♣ (Straight: 4-5-6-7-8)',
    },
    options: [
      { text: 'Player B wins — straights are very strong', correct: false },
      { text: 'Split pot — both are five-card hands', correct: false },
      { text: 'Player A wins — a flush beats a straight', correct: true },
      { text: 'Player B wins — their straight uses more board cards', correct: false },
    ],
    explanation:
      'A flush (five cards of the same suit) always beats a straight (five consecutive cards). Player A has A♥-J♥-8♥-4♥-2♥ (heart flush). Player B has 4-5-6-7-8 (straight). Remember: Straight < Flush in the hand rankings.',
    source: 'Practice question',
  },
];

export const pokerQuestions: PokerQuestion[] = [
  {
    id: 1,
    type: 'which_hand_wins',
    title: 'Full House vs. Full House',
    scenario: 'The board shows: 8♠ 8♦ 4♣ 4♥ 2♠',
    players: {
      player_a: 'A♣ 4♦ (Fours full of Eights)',
      player_b: 'K♠ 8♥ (Eights full of Fours)',
    },
    options: [
      { text: 'Player A wins — three Fours with Aces kicker', correct: false },
      { text: 'Player B wins — Eights full beats Fours full', correct: true },
      { text: 'Split pot — both have full houses', correct: false },
      { text: 'Player A wins — Fours full with an Ace', correct: false },
    ],
    explanation:
      'With full houses, the three-of-a-kind rank determines the winner. Player B has Eights full of Fours (8-8-8-4-4) which beats Player A\'s Fours full of Eights (4-4-4-8-8). The rank of the trips always matters more than the pair.',
    source: 'Classic hand ranking trap — SplitSuit, PokerNews hand ranking guides',
  },
  {
    id: 2,
    type: 'which_hand_wins',
    title: 'The Counterfeiting Trap',
    scenario: 'You hold 7♣ 6♠. The board runs out: A♠ A♦ 7♥ 6♦ 2♣. Your opponent holds A♥ 9♣.',
    players: {
      you: '7♣ 6♠',
      opponent: 'A♥ 9♣',
    },
    options: [
      { text: 'You win — you have two pair, Sevens and Sixes plus the Aces on board', correct: false },
      { text: 'Opponent wins — they have three Aces', correct: true },
      { text: 'You win — you have three pair (Aces, Sevens, Sixes)', correct: false },
      { text: 'Split pot — both play the Aces on the board', correct: false },
    ],
    explanation:
      'Three pair doesn\'t exist in poker — you can only use 5 cards. Your best hand is A-A-7-7-6 (two pair, Aces and Sevens). But your opponent has A-A-A-9-7 (three of a kind, Aces), which crushes your two pair. Many beginners think they have \'three pair\' here.',
    source: 'FunTrivia situational poker quiz, common beginner trap',
  },
  {
    id: 3,
    type: 'which_hand_wins',
    title: 'The Board Plays',
    scenario: 'The board shows: T♠ J♦ Q♣ K♥ A♠. Player A holds A♦ J♣. Player B holds 3♥ 5♦.',
    players: {
      player_a: 'A♦ J♣',
      player_b: '3♥ 5♦',
    },
    options: [
      { text: 'Player A wins — they have a pair of Aces and a pair of Jacks with the straight', correct: false },
      { text: 'Player A wins — their Ace plays as a kicker', correct: false },
      { text: 'Split pot — both play the board straight (T-J-Q-K-A)', correct: true },
      { text: 'Player A wins — they contribute to the straight', correct: false },
    ],
    explanation:
      'When the board itself makes the best possible hand (the Broadway straight T-J-Q-K-A), no hole cards can improve on it. Both players play the board, so it\'s always a split pot — even if one player holds 3-5 offsuit.',
    source: 'PokerNews hand ranking guide — board plays scenario',
  },
  {
    id: 4,
    type: 'which_hand_wins',
    title: 'Flush Over Flush',
    scenario: 'The board shows: 2♥ 7♥ 9♥ J♣ K♥. Player A holds A♠ 3♥. Player B holds Q♥ T♥.',
    players: {
      player_a: 'A♠ 3♥ (one heart)',
      player_b: 'Q♥ T♥ (two hearts)',
    },
    options: [
      { text: 'Player B wins — they have two hearts vs one', correct: false },
      { text: 'Player A wins — their 3♥ makes a K-high flush which beats Q-high', correct: false },
      { text: 'Player B wins — Q♥ T♥ makes a K-Q-T-9-7 flush', correct: true },
      { text: 'Player A wins — they have the Ace as kicker', correct: false },
    ],
    explanation:
      'Player A\'s best flush is K♥-9♥-7♥-3♥-2♥ (King-high). Player B\'s flush is K♥-Q♥-T♥-9♥-7♥ (also King-high but with Queen as second card). Flushes compare from highest card down. Both are K-high, but Player B\'s Q beats Player A\'s 9 in the second position. The A♠ is irrelevant — it\'s not a heart.',
    source: 'Common flush-over-flush confusion from poker forums',
  },
  {
    id: 5,
    type: 'right_play',
    title: 'Queens Facing a 3-Bet',
    scenario:
      '$2/$5 cash game, 200BB effective stacks. You open Q♠ Q♥ to $15 from the Hijack. A loose-aggressive player on the Button 3-bets to $50. Blinds fold. Action on you.',
    options: [
      { text: 'Fold — too risky against a 3-bet', correct: false },
      { text: 'Call — control the pot and see a flop', correct: true },
      { text: '4-bet to $130 — punish the LAG', correct: false },
      { text: '5-bet all-in — maximum pressure', correct: false },
    ],
    explanation:
      'At 200BB deep, flatting QQ against a Button 3-bet from a LAG is the preferred play. 4-betting bloats the pot and turns your hand face-up. By flatting, you keep their wide 3-betting range in while maintaining pot control. You\'ll face an overcard on the flop ~1/3 of the time, but your hand plays well postflop at this stack depth.',
    source: 'SplitSuit\'s \'10 Tough Poker Hands\' — Hand #2 (QQ vs Button 3-bet)',
  },
  {
    id: 6,
    type: 'right_play',
    title: 'AK Deep-Stacked Facing a 3-Bet',
    scenario:
      '$2/$5 cash game, 200BB effective. You open A♠ K♠ from middle position to $15. A TAG in the Cutoff 3-bets to $50. Folds back to you.',
    options: [
      { text: 'Fold — AK doesn\'t play well 200BB deep against a TAG 3-bet', correct: false },
      { text: 'Call — see a flop and re-evaluate', correct: true },
      { text: '4-bet to $135', correct: false },
      { text: 'Shove all-in', correct: false },
    ],
    explanation:
      'At 200BB deep vs a TAG 3-bet, AKs plays best as a flat call. 4-betting at this stack depth commits you to a pot where you\'re often flipping against the only hands that continue (QQ+, AK). By calling, you leverage position and your hand\'s postflop playability — it flops top pair or a strong draw very often. Folding AKs is far too tight here.',
    source: 'SplitSuit\'s \'10 Tough Poker Hands\' — Hand #5 (AK facing TAG 3-bet at 200BB)',
  },
  {
    id: 7,
    type: 'right_play',
    title: 'Kings in the Big Blind Facing a Squeeze',
    scenario:
      '$2/$5 cash game, 200BB effective. An EP LAG opens to $15. Two players call. A TAG in the small blind squeezes to $80. You\'re in the big blind with K♣ K♠.',
    options: [
      { text: 'Flat call — disguise your hand strength', correct: true },
      { text: '4-bet to $200 — isolate the squeezer', correct: false },
      { text: 'Shove all-in — maximum value', correct: false },
      { text: 'Fold — too many players, kings are vulnerable', correct: false },
    ],
    explanation:
      'With 200BB stacks, an EP opener and two callers behind, flatting KK here is devastating. The TAG squeeze range is often narrow (QQ+, AK). By flatting, you: (1) keep the EP opener and callers in with dead money, (2) disguise your hand completely, and (3) avoid building a massive pot where only AA has you dominated. If you 4-bet, most worse hands fold and you only get action from AA.',
    source: 'SplitSuit\'s \'10 Tough Poker Hands\' — Hand #7 (KK vs squeeze at 200BB)',
  },
  {
    id: 8,
    type: 'which_hand_wins',
    title: 'Two Pair Kicker Battle',
    scenario: 'The board shows: K♠ 9♦ 5♣ 3♥ 2♠. Player A holds K♦ T♣. Player B holds K♥ J♠.',
    players: {
      player_a: 'K♦ T♣',
      player_b: 'K♥ J♠',
    },
    options: [
      { text: 'Split pot — both have a pair of Kings', correct: false },
      { text: 'Player B wins — Jack kicker beats Ten kicker', correct: true },
      { text: 'Player A wins — T♣ makes a better five-card hand', correct: false },
      { text: 'Split pot — the 9 on the board is the kicker for both', correct: false },
    ],
    explanation:
      'Both players have a pair of Kings. The best five cards: Player A has K-K-T-9-5, Player B has K-K-J-9-5. The Jack kicker outkicks the Ten. A common mistake is thinking the board\'s 9 serves as the kicker for both — but each player\'s second hole card plays first.',
    source: 'PokerNews kicker battle examples',
  },
  {
    id: 9,
    type: 'right_play',
    title: 'Pocket Tens vs. the Nit Squeeze',
    scenario:
      '$2/$5 cash game, 100BB effective. An unknown opens to $15, a TAG in the cutoff calls. The known NIT on the button squeezes to $75. You\'re in the big blind with T♠ T♥.',
    options: [
      { text: 'Call — set mine and hope to flop a Ten', correct: false },
      { text: '4-bet to $180 — fight back against the squeeze', correct: false },
      { text: 'Fold — a nit\'s squeeze range crushes Tens', correct: true },
      { text: 'Shove all-in — flip for stacks', correct: false },
    ],
    explanation:
      'A known nit squeezing from the button after an open and a call is screaming strength — typically QQ+, maybe AK. Against that range, TT is in terrible shape. You\'re flipping at best (vs AK) and crushed at worst (vs QQ-AA). At 100BB, there\'s not enough implied odds to set-mine profitably. The disciplined fold is the correct play.',
    source: 'SplitSuit\'s \'10 Tough Poker Hands\' — Hand #10 (TT vs nit squeeze)',
  },
  {
    id: 10,
    type: 'which_hand_wins',
    title: 'The Hidden Straight',
    scenario: 'The board shows: 5♦ 6♣ 7♠ 8♥ K♦. Player A holds 9♣ 9♠. Player B holds 4♠ 4♣.',
    players: {
      player_a: '9♣ 9♠',
      player_b: '4♠ 4♣',
    },
    options: [
      { text: 'Player A wins — pair of Nines beats pair of Fours', correct: false },
      { text: 'Player A wins — they have a 5-6-7-8-9 straight', correct: true },
      { text: 'Split pot — both have a straight using the board', correct: false },
      { text: 'Player B wins — they have a 4-5-6-7-8 straight', correct: false },
    ],
    explanation:
      'Player A makes a 9-high straight (5-6-7-8-9) using one of their Nines. Player B also makes a straight (4-5-6-7-8) using one of their Fours. But Player A\'s straight is higher. The trap: many players see both hands as pairs and miss the straights entirely — or think the board\'s four sequential cards mean a split.',
    source: 'Common hand reading trap from poker training sites',
  },
];
