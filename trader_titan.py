import random
import time
import os
from questions import TRIVIA_QUESTIONS

# --- CLASSES ---

class Player:
    def __init__(self, name, is_human=False, profile="random"):
        self.name = name
        self.is_human = is_human
        self.profile = profile  # 'aggressive', 'conservative', 'random'
        self.pnl = 0.0
        self.cash = 0.0
        self.inventory = 0
        self.current_estimate = 0

    def reset_round_state(self):
        self.cash = 0.0
        self.inventory = 0
        self.current_estimate = 0

    def generate_estimate(self, true_answer):
        if self.profile == "aggressive":
            noise = random.uniform(0.9, 1.1)
        elif self.profile == "conservative":
            noise = random.uniform(0.8, 1.2)
        else:
            noise = random.uniform(0.6, 1.4)
        self.current_estimate = int(true_answer * noise)

    def update_estimate_with_clue(self, true_answer):
        # Clue narrows the bot's estimate (reduced noise)
        if self.profile == "aggressive":
            noise = random.uniform(0.95, 1.05)
        elif self.profile == "conservative":
            noise = random.uniform(0.9, 1.1)
        else:
            noise = random.uniform(0.85, 1.15)
        self.current_estimate = int(true_answer * noise)

    def bid_spread(self, true_answer):
        if not self.is_human:
            self.generate_estimate(true_answer)
            base_spread = max(1, int(self.current_estimate * 0.1))
            if self.profile == "aggressive":
                return int(base_spread * random.uniform(0.5, 1.0))
            elif self.profile == "conservative":
                return int(base_spread * random.uniform(1.5, 2.5))
            else:
                return int(base_spread * random.uniform(0.8, 2.0))
        return 0

    def quote_market(self, winning_spread):
        half_spread = winning_spread // 2
        bid = max(0, self.current_estimate - half_spread)
        ask = bid + winning_spread
        if self.profile == "aggressive":
            bid_size = random.randint(3, 5)
            ask_size = random.randint(3, 5)
        elif self.profile == "conservative":
            bid_size = random.randint(1, 2)
            ask_size = random.randint(1, 2)
        else:
            bid_size = random.randint(1, 4)
            ask_size = random.randint(1, 4)
        return bid, ask, bid_size, ask_size

    def decide_trade(self, bid, ask, bid_size, ask_size):
        if self.profile == "aggressive":
            if self.current_estimate > ask and ask_size > 0:
                return "buy"
            if self.current_estimate < bid and bid_size > 0:
                return "sell"
        elif self.profile == "conservative":
            if self.current_estimate > (ask * 1.1) and ask_size > 0:
                return "buy"
            if self.current_estimate < (bid * 0.9) and bid_size > 0:
                return "sell"
        else:
            choice = random.random()
            if choice > 0.8 and ask_size > 0:
                return "buy"
            elif choice < 0.2 and bid_size > 0:
                return "sell"
        return "pass"


class TraderTitanGame:
    def __init__(self):
        self.players = [
            Player("Human (You)", is_human=True),
            Player("Bot Alpha", profile="aggressive"),
            Player("Bot Beta", profile="conservative"),
            Player("Bot Gamma", profile="random")
        ]
        self.current_bid = 0
        self.current_ask = 0
        self.current_bid_size = 0
        self.current_ask_size = 0
        self.market_maker = None

    def clear_screen(self):
        os.system('cls' if os.name == 'nt' else 'clear')

    def _format_market(self):
        return (f"{self.current_bid} at {self.current_ask}, "
                f"{self.current_bid_size} by {self.current_ask_size}")

    def print_ui_header(self, round_num, question, clue=None):
        self.clear_screen()
        print("=" * 60)
        print(f"--- TRADER TITAN | ROUND {round_num}/5 ---".center(60))
        print("=" * 60)
        print(f"\nQUESTION: {question}\n")
        if clue:
            print(f"CLUE: {clue}\n")
        print("-" * 60)

    def print_leaderboard(self, final=False):
        print("\n" + "=" * 60)
        print("FINAL LEADERBOARD" if final else "CURRENT LEADERBOARD")
        print("=" * 60)
        sorted_players = sorted(self.players, key=lambda x: x.pnl, reverse=True)
        for i, p in enumerate(sorted_players):
            print(f"{i+1}. {p.name:<15} | Total P&L: {p.pnl:,.2f}")
        print("=" * 60 + "\n")
        if not final:
            input("Press Enter to continue...")

    def execute_trade(self, player, action):
        if action == "buy":
            if self.current_ask_size <= 0:
                print(f"> {player.name} wanted to BUY but no asks remaining in market.")
                return
            player.inventory += 1
            player.cash -= self.current_ask
            self.market_maker.inventory -= 1
            self.market_maker.cash += self.current_ask
            self.current_ask_size -= 1
            print(f"> {player.name} BOUGHT 1 @ {self.current_ask}  "
                  f"[Market: {self._format_market()}]")
        elif action == "sell":
            if self.current_bid_size <= 0:
                print(f"> {player.name} wanted to SELL but no bids remaining in market.")
                return
            player.inventory -= 1
            player.cash += self.current_bid
            self.market_maker.inventory += 1
            self.market_maker.cash -= self.current_bid
            self.current_bid_size -= 1
            print(f"> {player.name} SOLD  1 @ {self.current_bid}  "
                  f"[Market: {self._format_market()}]")
        else:
            print(f"> {player.name} passed.")

    def _prompt_market_quote(self, winning_spread):
        """Prompts the human market maker to enter bid price and both sizes."""
        while True:
            try:
                bid_val = int(input(f"  BID price (Ask = BID + {winning_spread}): "))
                bid_sz  = int(input("  BID size  (units you are willing to buy):  "))
                ask_sz  = int(input("  ASK size  (units you are willing to sell): "))
                if bid_sz <= 0 or ask_sz <= 0:
                    print("  Sizes must be positive integers.")
                    continue
                self.current_bid      = bid_val
                self.current_ask      = bid_val + winning_spread
                self.current_bid_size = bid_sz
                self.current_ask_size = ask_sz
                break
            except ValueError:
                print("  Invalid input. Please enter integers only.")

    def play_round(self, round_num, round_data):
        true_answer = round_data["answer"]

        for p in self.players:
            p.reset_round_state()

        # ── PHASE 1: SPREAD BIDDING ──────────────────────────────────────
        self.print_ui_header(round_num, round_data["question"])
        print("PHASE 1: SPREAD BIDDING  (Lowest spread becomes Market Maker)\n")

        bids = {}
        for p in self.players:
            if p.is_human:
                while True:
                    try:
                        spread = int(input("Enter your desired spread width (integer): "))
                        if spread < 0:
                            print("Spread cannot be negative.")
                            continue
                        bids[p] = spread
                        break
                    except ValueError:
                        print("Invalid input. Please enter a number.")
            else:
                bids[p] = p.bid_spread(true_answer)
                print(f"{p.name} bids a spread of {bids[p]}")
                time.sleep(1)

        self.market_maker = min(bids, key=bids.get)
        winning_spread = bids[self.market_maker]
        print(f"\n*** {self.market_maker.name.upper()} WINS THE RIGHT TO QUOTE "
              f"WITH A SPREAD OF {winning_spread}! ***")
        time.sleep(2)

        # ── PHASE 2: INITIAL MARKET QUOTING ─────────────────────────────
        self.print_ui_header(round_num, round_data["question"])
        print(f"PHASE 2: MARKET QUOTING  (Required spread: {winning_spread})\n")
        print("Market format:  BID at ASK, BID_SIZE by ASK_SIZE\n")

        if self.market_maker.is_human:
            self._prompt_market_quote(winning_spread)
        else:
            (self.current_bid, self.current_ask,
             self.current_bid_size, self.current_ask_size) = \
                self.market_maker.quote_market(winning_spread)

        print(f"\nMarket set by {self.market_maker.name}:  {self._format_market()}\n")
        input("Press Enter to open the market...")

        # ── PHASE 3a: PRE-CLUE TRADING ───────────────────────────────────
        self.print_ui_header(round_num, round_data["question"])
        print(f"MARKET: {self._format_market()}\n")
        print("TRADING PHASE 1/2  (No clue yet)\n")

        for p in self.players:
            if p == self.market_maker:
                continue
            if p.is_human:
                print(f"\nYour Position -> Inventory: {p.inventory} | Cash: {p.cash}")
                action = input("Do you want to (B)uy, (S)ell, or (P)ass? ").lower()
                if action.startswith('b'):
                    self.execute_trade(p, "buy")
                elif action.startswith('s'):
                    self.execute_trade(p, "sell")
                else:
                    self.execute_trade(p, "pass")
            else:
                action = p.decide_trade(
                    self.current_bid, self.current_ask,
                    self.current_bid_size, self.current_ask_size
                )
                self.execute_trade(p, action)
                time.sleep(1)

        # ── CLUE REVEAL & MARKET RE-QUOTE ────────────────────────────────
        self.print_ui_header(round_num, round_data["question"], round_data["clue"])
        print(f"Current Market: {self._format_market()}\n")
        print(f"*** CLUE REVEALED — {self.market_maker.name.upper()} "
              f"MAY NOW UPDATE THE MARKET ***\n")

        if self.market_maker.is_human:
            update = input("Do you want to update your market? (Y/N): ").lower()
            if update.startswith('y'):
                print()
                self._prompt_market_quote(winning_spread)
        else:
            self.market_maker.update_estimate_with_clue(true_answer)
            (self.current_bid, self.current_ask,
             self.current_bid_size, self.current_ask_size) = \
                self.market_maker.quote_market(winning_spread)
            print(f"{self.market_maker.name} updates market to: {self._format_market()}")
            time.sleep(1)

        print(f"\nMarket heading into Phase 2:  {self._format_market()}\n")
        input("Press Enter for post-clue trading...")

        # ── PHASE 3b: POST-CLUE TRADING ──────────────────────────────────
        self.print_ui_header(round_num, round_data["question"], round_data["clue"])
        print(f"MARKET: {self._format_market()}\n")
        print("TRADING PHASE 2/2\n")

        for p in self.players:
            if p == self.market_maker:
                continue
            if p.is_human:
                print(f"\nYour Position -> Inventory: {p.inventory} | Cash: {p.cash}")
                action = input("Do you want to (B)uy, (S)ell, or (P)ass? ").lower()
                if action.startswith('b'):
                    self.execute_trade(p, "buy")
                elif action.startswith('s'):
                    self.execute_trade(p, "sell")
                else:
                    self.execute_trade(p, "pass")
            else:
                action = p.decide_trade(
                    self.current_bid, self.current_ask,
                    self.current_bid_size, self.current_ask_size
                )
                self.execute_trade(p, action)
                time.sleep(1)

        # ── PHASE 4: SETTLEMENT ──────────────────────────────────────────
        print("\n" + "*" * 60)
        print("SETTLEMENT PHASE")
        print("*" * 60)
        print(f"\nThe True Answer is: {true_answer}!\n")

        for p in self.players:
            round_pnl = p.cash + (p.inventory * true_answer)
            p.pnl += round_pnl
            print(f"{p.name:<15} | Inv: {p.inventory:>2} | Round P&L: {round_pnl:>10,.2f}")

        time.sleep(3)
        self.print_leaderboard(final=False)

    def run(self):
        self.clear_screen()
        print("Welcome to TRADER TITAN!")
        print("You are competing against 3 AI bots to make markets and trade true values.")
        print("Tight spreads win the right to quote. Buy low, sell high, and manage your risk!")
        print("Markets are quoted as:  BID at ASK, BID_SIZE by ASK_SIZE\n")
        input("Press Enter to Start...")

        selected_questions = random.sample(TRIVIA_QUESTIONS, 5)
        for i, q in enumerate(selected_questions):
            self.play_round(i + 1, q)

        self.print_leaderboard(final=True)
        print("Thanks for playing Trader Titan!")


if __name__ == "__main__":
    game = TraderTitanGame()
    game.run()
