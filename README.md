# antigravity-quota

[한국어](./README_ko.md)

A CLI tool for checking Antigravity usage quota for opencode users with Google Antigravity.

## Installation

```bash
# Clone repository
git clone https://github.com/Yoo-bin/antigravity-quota.git
cd antigravity-quota

# Install dependencies
bun install

# Global install
bun link
```

## Usage

```bash
# Check quota with formatted table
ag quota

# Output raw API JSON response
ag quota --raw
ag quota -r
```

## Shell Completion

Enable tab completion for bash, zsh, or fish shells.

```bash
# Automatic install (recommended)
ag completion --install

# Or manual setup for each shell:

# Zsh
echo 'eval "$(ag completion zsh)"' >> ~/.zshrc

# Bash
echo 'eval "$(ag completion bash)"' >> ~/.bashrc

# Fish
echo 'ag completion fish | source' >> ~/.config/fish/config.fish
```

After setup, restart your shell or run `source ~/.zshrc` (or equivalent).

### Completion Examples

| Input              | Completion Result        |
|--------------------|--------------------------|
| `ag q<TAB>`        | `quota`                  |
| `ag c<TAB>`        | `completion`             |
| `ag quota -<TAB>`  | `--raw`, `-r`, `--help`  |

### Output Example

```
Account: user@gmail.com
┌──────────────┬────────┬───────────────────┐
│ Model        │ Quota  │ Reset Time        │
├──────────────┼────────┼───────────────────┤
│ gemini-3-pro │ 100.0% │ in 5h             │
├──────────────┼────────┼───────────────────┤
│ gemini       │ 80.0%  │ in 6 days 23h 59m │
├──────────────┼────────┼───────────────────┤
│ claude       │ 53.0%  │ in 1 day 5h 30m   │
└──────────────┴────────┴───────────────────┘
```

## Requirements

- Bun >= 1.0.0
- opencode-antigravity-auth required (`~/.config/opencode/antigravity-accounts.json` file required)

## Features

- View quota for all Antigravity accounts
- Group by model (gemini-3-pro, gemini, claude)
- Color-coded quota display based on remaining quota
  - 50% or more: Green
  - 20% or more: Yellow
  - Below 20%: Red
- Reset time displayed in relative format (e.g., `in 4h 59m`, `in 6 days 23h 59m`)

## License

MIT
