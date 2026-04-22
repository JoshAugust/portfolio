// ─── Types ─────────────────────────────────────────────────────────────────────
export type CorrectAnswer = 'player_a' | 'player_b' | 'split';

export interface WhichHandWinsQuestion {
  id: number;
  type: 'which_hand_wins';
  title: string;
  scenario: string;
  players: {
    player_a: string;
    player_b: string;
  };
  correctAnswer: CorrectAnswer;
  explanation: string;
  source: string;
}

export interface RightPlayQuestion {
  id: number;
  type: 'right_play';
  title: string;
  scenario: string;
  explanation: string;
  source: string;
}

export type PokerQuestion = WhichHandWinsQuestion | RightPlayQuestion;

// ─── Practice Questions (1 — which_hand_wins, 3-button format) ─────────────────
export const practiceQuestions: WhichHandWinsQuestion[] = [
  {
    id: 101,
    type: 'which_hand_wins',
    title: 'Practice — Pair vs. Two Pair',
    scenario: 'The board shows: 3♠ 7♦ T♣ K♥ 2♦',
    players: {
      player_a: 'K♠ 9♣',
      player_b: 'T♠ 7♣',
    },
    correctAnswer: 'player_b',
    explanation:
      "Two pair always beats one pair, regardless of the ranks. Player B's Tens and Sevens (two pair) beats Player A's Kings (one pair). Hand rankings: High Card < One Pair < Two Pair < Three of a Kind < Straight < Flush < Full House < Four of a Kind < Straight Flush.",
    source: 'Practice question',
  },
];

// ─── Section 1: Which Hand Wins? (10 questions) ────────────────────────────────
export const section1Questions: WhichHandWinsQuestion[] = [
  {
    id: 1,
    type: 'which_hand_wins',
    title: 'Full House vs. Full House',
    scenario: 'The board shows: 8♠ 8♦ 4♣ 4♥ 2♠',
    players: {
      player_a: 'A♣ 4♦',
      player_b: 'K♠ 8♥',
    },
    correctAnswer: 'player_b',
    explanation:
      "With full houses, the three-of-a-kind rank determines the winner. Player B has Eights full of Fours (8-8-8-4-4) which beats Player A's Fours full of Eights (4-4-4-8-8). The rank of the trips always matters more than the pair.",
    source: 'Classic hand ranking trap — SplitSuit, PokerNews hand ranking guides',
  },
  {
    id: 2,
    type: 'which_hand_wins',
    title: 'Full House Showdown',
    scenario: 'The board shows: A♠ A♦ 7♥ 6♦ 2♣',
    players: {
      player_a: '6♠ 6♣',
      player_b: 'A♥ 2♠',
    },
    correctAnswer: 'player_b',
    explanation:
      "Player A has Sixes full of Aces (6-6-6-A-A) — using both sixes from hand plus the 6♦ on the board, paired with the two Aces. Player B has Aces full of Twos (A-A-A-2-2) — three Aces plus two Twos. With full houses, the three-of-a-kind rank determines the winner. Aces full always beats Sixes full.",
    source: 'FunTrivia situational poker quiz, common beginner trap',
  },
  {
    id: 3,
    type: 'which_hand_wins',
    title: 'The Board Plays',
    scenario: 'The board shows: K♥ T♠ A♠ J♦ Q♣',
    players: {
      player_a: 'A♦ J♣',
      player_b: 'Q♥ Q♦',
    },
    correctAnswer: 'split',
    explanation:
      "The board makes a Broadway straight (T-J-Q-K-A). Even though Player B has a set of Queens (three Queens with Q♣ on the board), a straight beats three of a kind. Both players' best five-card hand is the board straight — it's always a split pot when the board has the nuts.",
    source: 'PokerNews hand ranking guide — board plays scenario',
  },
  {
    id: 4,
    type: 'which_hand_wins',
    title: 'Flush Over Flush',
    scenario: 'The board shows: 2♥ 7♥ 9♥ J♣ K♥',
    players: {
      player_a: 'A♥ 3♠',
      player_b: 'Q♥ T♥',
    },
    correctAnswer: 'player_a',
    explanation:
      "Player A's A♥ gives them an Ace-high flush (A♥-K♥-9♥-7♥-2♥). Player B's flush is K♥-Q♥-T♥-9♥-7♥ (King-high). Even though Player B has two hearts vs Player A's one, it doesn't matter — flushes are ranked by the highest cards. The Ace of hearts is the key card here. The 3♠ is irrelevant.",
    source: 'Common flush-over-flush confusion from poker forums',
  },
  {
    id: 8,
    type: 'which_hand_wins',
    title: 'Two Pair Kicker Battle',
    scenario: 'The board shows: K♠ 9♦ 5♣ 3♥ 2♠',
    players: {
      player_a: 'K♦ T♣',
      player_b: 'K♥ J♠',
    },
    correctAnswer: 'player_b',
    explanation:
      "Both players have a pair of Kings. The best five cards: Player A has K-K-T-9-5, Player B has K-K-J-9-5. The Jack kicker outkicks the Ten. A common mistake is thinking the board's 9 serves as the kicker for both — but each player's second hole card plays first.",
    source: 'PokerNews kicker battle examples',
  },
  {
    id: 10,
    type: 'which_hand_wins',
    title: 'The Hidden Straight',
    scenario: 'The board shows: 8♥ K♦ 5♦ 7♠ 6♣',
    players: {
      player_a: 'T♠ T♥',
      player_b: '4♠ 4♣',
    },
    correctAnswer: 'player_b',
    explanation:
      "Player A has a pair of Tens (T-T-K-8-7) — their Tens don't connect with the board to make a straight. But Player B's Fours complete a straight: 4-5-6-7-8. A straight always beats one pair. The trap: the board shows four consecutive cards (5-6-7-8), and Player B's seemingly weak 4♠ 4♣ connects perfectly.",
    source: 'Common hand reading trap from poker training sites',
  },
  {
    id: 11,
    type: 'which_hand_wins',
    title: 'The Set Trap',
    scenario: 'The board shows: A♠ 7♦ 7♣ 3♥ 9♠',
    players: {
      player_a: 'A♦ 7♥',
      player_b: '9♣ 9♦',
    },
    correctAnswer: 'player_b',
    explanation:
      "Both players make a full house. Player A has Sevens full of Aces (7-7-7-A-A) using 7♥ from hand plus 7♦ 7♣ on board, paired with Aces. Player B has Nines full of Sevens (9-9-9-7-7) using 9♣ 9♦ from hand plus 9♠ on board, with the board's 7♦ 7♣ as the pair. With full houses, the three-of-a-kind rank always determines the winner — Nines beat Sevens.",
    source: 'Hand ranking fundamentals',
  },
  {
    id: 12,
    type: 'which_hand_wins',
    title: 'The Nut Straight',
    scenario: 'The board shows: 7♥ K♠ 4♠ 6♣ 5♦',
    players: {
      player_a: '8♣ 9♠',
      player_b: '8♠ 7♣',
    },
    correctAnswer: 'player_a',
    explanation:
      "Both players make a straight. Player A's 8♣ 9♠ makes a 9-high straight (5-6-7-8-9). Player B's 8♠ 7♣ makes an 8-high straight (4-5-6-7-8). Player A's higher straight wins. When the board has consecutive cards, always check who makes the HIGHER straight.",
    source: 'Straight comparison fundamentals',
  },
  {
    id: 13,
    type: 'which_hand_wins',
    title: 'The Hidden Flush',
    scenario: 'The board shows: A♥ T♣ 5♣ 3♣ 2♠',
    players: {
      player_a: 'A♠ K♦',
      player_b: 'A♣ Q♣',
    },
    correctAnswer: 'player_b',
    explanation:
      "Player A has a pair of Aces with a King kicker (A-A-K-T-5). But Player B has an Ace-high club flush — A♣ and Q♣ combine with three clubs on the board (T♣-5♣-3♣) to make A♣-Q♣-T♣-5♣-3♣. A flush always beats one pair. Always check for flush possibilities when three cards of one suit appear on the board.",
    source: 'Kicker play fundamentals',
  },
  {
    id: 14,
    type: 'which_hand_wins',
    title: 'Counterfeit Two Pair',
    scenario: 'The board shows: K♠ K♦ Q♣ Q♥ J♠',
    players: {
      player_a: 'A♣ 2♦',
      player_b: 'J♥ 3♠',
    },
    correctAnswer: 'player_a',
    explanation:
      "The board has two pair (Kings and Queens). Player A plays K-K-Q-Q-A (using the Ace as kicker). Player B's best five cards are K-K-Q-Q-J. Player A's Ace kicker beats Player B's Jack kicker.",
    source: 'Board counterfeiting scenarios',
  },
];

// ─── Section 2: What's Your Play? (3 questions) ────────────────────────────────
export const section2Questions: RightPlayQuestion[] = [
  {
    id: 5,
    type: 'right_play',
    title: 'Queens Facing a 3-Bet',
    scenario:
      'MTT, Level 12 (600/1200 + 1200 ante). You have 45BB. You open Q♠ Q♥ to 2.5BB from the Hijack. A loose-aggressive player on the Button 3-bets to 7BB. Blinds fold. Action on you.',
    explanation:
      "In a tournament with 45BB, flatting QQ against a Button 3-bet from a LAG is reasonable — you keep their wide 3-betting range in while maintaining pot control. However, 4-betting small (to ~16BB) is also viable at this stack depth to build the pot with a premium hand. Shoving risks folding out worse hands. The key is stack-to-pot ratio: with 45BB, you have room to play postflop.",
    source: "SplitSuit's '10 Tough Poker Hands' — Hand #2 (QQ vs Button 3-bet)",
  },
  {
    id: 6,
    type: 'right_play',
    title: 'AK Deep-Stacked Facing a 3-Bet',
    scenario:
      'MTT, Level 15 (1000/2000 + 2000 ante). You have 35BB. You open A♠ K♠ to 2.2BB from middle position. A TAG in the Cutoff 3-bets to 6BB. Folds back to you.',
    explanation:
      "At 35BB in a tournament, AKs is too strong to fold facing a 3-bet. Flatting keeps their range wide. 4-bet shoving is also a strong play since you have fold equity and AKs plays well all-in against a typical 3-bet range (QQ, AK, JJ). The dead money from the antes makes shoving more attractive than in a cash game.",
    source: "SplitSuit's '10 Tough Poker Hands' — Hand #5 (AK facing TAG 3-bet at 200BB)",
  },
  {
    id: 7,
    type: 'right_play',
    title: 'Kings in the Big Blind Facing a Squeeze',
    scenario:
      "MTT, Level 18 (2000/4000 + 4000 ante). You have 30BB. An EP LAG opens to 2.2BB. Two players call. A TAG in the small blind squeezes to 9BB. You're in the big blind with K♣ K♠.",
    explanation:
      "With 30BB in a tournament, KK is almost always going all-in here. Unlike deep-stacked cash games where flatting can be devastating, at 30BB the stack-to-pot ratio is too shallow for postflop play. The pot already has ~16BB of dead money. Shoving puts maximum pressure on the squeezer and anyone else in the hand. Slow-playing KK at short/medium stacks in tournaments is a common leak.",
    source: "SplitSuit's '10 Tough Poker Hands' — Hand #7 (KK vs squeeze at 200BB)",
  },
];

// ─── Legacy combined export (backward compat) ──────────────────────────────────
export const pokerQuestions: PokerQuestion[] = [...section1Questions, ...section2Questions];

// ─── Legacy types (backward compat) ───────────────────────────────────────────
export interface PokerOption {
  text: string;
  correct: boolean;
}
