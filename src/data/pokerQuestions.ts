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

// ─── Practice Questions (2 — which_hand_wins, 3-button format) ─────────────────
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
  {
    id: 102,
    type: 'which_hand_wins',
    title: 'Practice — The Board Plays',
    scenario: 'The board shows: A♠ K♦ Q♣ J♥ T♠',
    players: {
      player_a: '9♣ 2♦',
      player_b: '3♥ 7♠',
    },
    correctAnswer: 'split',
    explanation:
      "The board makes a Broadway straight (A-K-Q-J-T). Neither player's hole cards can improve on it, so both play the board. It's always a split pot.",
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
    title: 'The Counterfeiting Trap',
    scenario: 'Player A holds 7♣ 6♠. The board runs out: A♠ A♦ 7♥ 6♦ 2♣. Player B holds A♥ 9♣.',
    players: {
      player_a: '7♣ 6♠',
      player_b: 'A♥ 9♣',
    },
    correctAnswer: 'player_b',
    explanation:
      "Three pair doesn't exist in poker — you can only use 5 cards. Player A's best hand is A-A-7-7-6 (two pair, Aces and Sevens). But Player B has A-A-A-9-7 (three of a kind, Aces), which crushes two pair. Many beginners think they have 'three pair' here.",
    source: 'FunTrivia situational poker quiz, common beginner trap',
  },
  {
    id: 3,
    type: 'which_hand_wins',
    title: 'The Board Plays',
    scenario: 'The board shows: T♠ J♦ Q♣ K♥ A♠',
    players: {
      player_a: 'A♦ J♣',
      player_b: '3♥ 5♦',
    },
    correctAnswer: 'split',
    explanation:
      "When the board itself makes the best possible hand (the Broadway straight T-J-Q-K-A), no hole cards can improve on it. Both players play the board, so it's always a split pot — even if one player holds 3-5 offsuit.",
    source: 'PokerNews hand ranking guide — board plays scenario',
  },
  {
    id: 4,
    type: 'which_hand_wins',
    title: 'Flush Over Flush',
    scenario: 'The board shows: 2♥ 7♥ 9♥ J♣ K♥',
    players: {
      player_a: 'A♠ 3♥',
      player_b: 'Q♥ T♥',
    },
    correctAnswer: 'player_b',
    explanation:
      "Player A's best flush is K♥-9♥-7♥-3♥-2♥ (King-high). Player B's flush is K♥-Q♥-T♥-9♥-7♥ (also King-high but with Queen as second card). Flushes compare from highest card down. Both are K-high, but Player B's Q beats Player A's 9 in the second position. The A♠ is irrelevant — it's not a heart.",
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
    scenario: 'The board shows: 5♦ 6♣ 7♠ 8♥ K♦',
    players: {
      player_a: '9♣ 9♠',
      player_b: '4♠ 4♣',
    },
    correctAnswer: 'player_a',
    explanation:
      "Player A makes a 9-high straight (5-6-7-8-9) using one of their Nines. Player B also makes a straight (4-5-6-7-8) using one of their Fours. But Player A's straight is higher. The trap: many players see both hands as pairs and miss the straights entirely — or think the board's four sequential cards mean a split.",
    source: 'Common hand reading trap from poker training sites',
  },
  {
    id: 11,
    type: 'which_hand_wins',
    title: 'The Set Trap',
    scenario: 'The board shows: A♠ 7♦ 7♣ 3♥ 9♠',
    players: {
      player_a: '7♥ 2♠',
      player_b: 'A♦ A♣',
    },
    correctAnswer: 'player_b',
    explanation:
      'Player A has three Sevens (7-7-7-A-9). Player B has Aces full of Sevens (A-A-A-7-7) — a full house, which always beats three of a kind.',
    source: 'Hand ranking fundamentals',
  },
  {
    id: 12,
    type: 'which_hand_wins',
    title: 'The Nut Straight',
    scenario: 'The board shows: 4♠ 5♦ 6♣ 7♥ K♠',
    players: {
      player_a: '8♣ 9♠',
      player_b: '3♥ 8♦',
    },
    correctAnswer: 'player_a',
    explanation:
      "Both players make a straight, but Player A's straight runs 5-6-7-8-9 while Player B's runs 4-5-6-7-8. Player A's 9-high straight beats Player B's 8-high straight.",
    source: 'Straight comparison fundamentals',
  },
  {
    id: 13,
    type: 'which_hand_wins',
    title: 'Top Pair Top Kicker',
    scenario: 'The board shows: A♥ T♣ 5♦ 3♠ 2♣',
    players: {
      player_a: 'A♠ K♦',
      player_b: 'A♣ Q♠',
    },
    correctAnswer: 'player_a',
    explanation:
      "Both players have a pair of Aces. Player A's best five cards are A-A-K-T-5, while Player B's are A-A-Q-T-5. The King kicker plays — Player A wins.",
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
      '$2/$5 cash game, 200BB effective stacks. You open Q♠ Q♥ to $15 from the Hijack. A loose-aggressive player on the Button 3-bets to $50. Blinds fold. Action on you.',
    explanation:
      "At 200BB deep, flatting QQ against a Button 3-bet from a LAG is the preferred play. 4-betting bloats the pot and turns your hand face-up. By flatting, you keep their wide 3-betting range in while maintaining pot control. You'll face an overcard on the flop ~1/3 of the time, but your hand plays well postflop at this stack depth.",
    source: "SplitSuit's '10 Tough Poker Hands' — Hand #2 (QQ vs Button 3-bet)",
  },
  {
    id: 6,
    type: 'right_play',
    title: 'AK Deep-Stacked Facing a 3-Bet',
    scenario:
      '$2/$5 cash game, 200BB effective. You open A♠ K♠ from middle position to $15. A TAG in the Cutoff 3-bets to $50. Folds back to you.',
    explanation:
      "At 200BB deep vs a TAG 3-bet, AKs plays best as a flat call. 4-betting at this stack depth commits you to a pot where you're often flipping against the only hands that continue (QQ+, AK). By calling, you leverage position and your hand's postflop playability — it flops top pair or a strong draw very often. Folding AKs is far too tight here.",
    source: "SplitSuit's '10 Tough Poker Hands' — Hand #5 (AK facing TAG 3-bet at 200BB)",
  },
  {
    id: 7,
    type: 'right_play',
    title: 'Kings in the Big Blind Facing a Squeeze',
    scenario:
      "$2/$5 cash game, 200BB effective. An EP LAG opens to $15. Two players call. A TAG in the small blind squeezes to $80. You're in the big blind with K♣ K♠.",
    explanation:
      "With 200BB stacks, an EP opener and two callers behind, flatting KK here is devastating. The TAG squeeze range is often narrow (QQ+, AK). By flatting, you: (1) keep the EP opener and callers in with dead money, (2) disguise your hand completely, and (3) avoid building a massive pot where only AA has you dominated. If you 4-bet, most worse hands fold and you only get action from AA.",
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
