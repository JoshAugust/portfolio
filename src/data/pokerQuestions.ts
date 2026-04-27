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
    scenario: 'The board shows: K♥ 2♦ 7♦ T♣ 3♠',
    players: {
      player_a: '9♣ K♠',
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
    scenario: 'The board shows: 4♣ 2♠ 8♦ 4♥ 8♠',
    players: {
      player_a: '4♦ A♣',
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
    scenario: 'The board shows: 6♦ A♠ 2♣ 7♥ A♦',
    players: {
      player_a: '6♠ 6♣',
      player_b: '2♠ A♥',
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
    scenario: 'The board shows: A♠ Q♣ K♥ J♦ T♠',
    players: {
      player_a: 'J♣ A♦',
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
    scenario: 'The board shows: K♥ 9♥ J♣ 2♥ 7♥',
    players: {
      player_a: 'A♥ 3♠',
      player_b: 'T♥ Q♥',
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
    scenario: 'The board shows: 3♥ K♠ 2♠ 9♦ 5♣',
    players: {
      player_a: 'K♦ T♣',
      player_b: 'J♠ K♥',
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
    scenario: 'The board shows: 5♦ 8♥ 6♣ K♦ 7♠',
    players: {
      player_a: 'T♥ T♠',
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
    title: 'The Kicker Trap',
    scenario: 'The board shows: T♥ A♣ 3♠ K♠ Q♦',
    players: {
      player_a: 'K♦ 5♣',
      player_b: '9♦ K♥',
    },
    correctAnswer: 'split',
    explanation:
      "Both players have a pair of Kings. But the kicker doesn't matter here — the board has A, Q, and T which are all higher than either player's second card (5 and 9). Both players' best five cards are K-K-A-Q-T. When the board cards outrank your kicker, it's always a split pot.",
    source: 'Kicker play fundamentals',
  },
  {
    id: 12,
    type: 'which_hand_wins',
    title: 'The Nut Straight',
    scenario: 'The board shows: 4♠ 5♦ K♠ 7♥ 6♣',
    players: {
      player_a: '9♠ 8♣',
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
    scenario: 'The board shows: 5♣ 2♠ A♥ 3♣ T♣',
    players: {
      player_a: 'A♠ K♦',
      player_b: 'Q♣ A♣',
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
    scenario: 'The board shows: Q♥ K♦ J♠ K♠ Q♣',
    players: {
      player_a: '2♦ A♣',
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
    title: 'Queens Facing a Re-Raise',
    scenario:
      "You're late stage in a tournament with 45 big blinds. You raise with Q♠ Q♥ from the Hijack. A loose, aggressive player on the Button re-raises to 7BB. The blinds fold. It's on you.",
    explanation:
      "With 45BB, you have enough room to just call and play the flop — keeping their wide range in while controlling the pot size. Raising again is also fine at this stack depth to build the pot with a premium hand. Shoving is aggressive but risks folding out all the worse hands you want action from. The key question: do you want to play a big pot before the flop, or see a flop first?",
    source: "SplitSuit's '10 Tough Poker Hands' — Hand #2 (QQ vs Button 3-bet)",
  },
  {
    id: 6,
    type: 'right_play',
    title: 'Ace-King Facing a Re-Raise',
    scenario:
      "You're deep in a tournament with 35 big blinds. You raise with A♠ K♠ from middle position. A tight, solid player in the Cutoff re-raises to 6BB. Everyone else folds. It's back to you.",
    explanation:
      "AK suited is too strong to fold here. Calling keeps their range wide and lets you see a flop. Going all-in is also a solid play — you have fold equity, and AK suited holds up well even when called. The antes in the pot make pushing more attractive. Against a tight player, calling is safer; against someone who re-raises a lot, shoving puts the pressure back on them.",
    source: "SplitSuit's '10 Tough Poker Hands' — Hand #5 (AK facing 3-bet)",
  },
  {
    id: 7,
    type: 'right_play',
    title: 'Kings Facing a Squeeze',
    scenario:
      "You're deep in a tournament with 30 big blinds. An aggressive player in early position raises. Two players call. A tight player in the small blind re-raises to 9BB. You're in the big blind with K♣ K♠.",
    explanation:
      "With 30BB, Kings are almost always going all-in here. The pot already has a lot of dead money from the opener and callers. At this stack depth, there's not enough room to call and play the flop comfortably — if an Ace hits, you're in a tough spot. Pushing all-in puts maximum pressure on everyone. Slow-playing big pairs with shorter stacks in tournaments is a common mistake.",
    source: "SplitSuit's '10 Tough Poker Hands' — Hand #7 (KK vs squeeze)",
  },
];

// ─── Legacy combined export (backward compat) ──────────────────────────────────
export const pokerQuestions: PokerQuestion[] = [...section1Questions, ...section2Questions];

// ─── Legacy types (backward compat) ───────────────────────────────────────────
export interface PokerOption {
  text: string;
  correct: boolean;
}
