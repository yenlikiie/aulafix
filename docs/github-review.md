# Review, author identity, pull request and contribution credit

Work is on `feature/organizations-that-can-help`, based on main commit `d708d6f`. Do not merge or deploy before the owner approves. Do not use an inherited workspace identity without verifying it belongs to the owner. This guide does not invent a name or email.

## 1. Review and configure your identity

Review `git status --short`, `git diff`, and all new files. Run the checks in `docs/organizations-mvp.md`. Approve the implementation before committing it as your work.

In **your own GitHub account → Settings → Emails**, select an email already verified on that account, or copy the exact GitHub-provided noreply address. Do not derive or guess a noreply address from the repository username. Your Git author name can be your chosen name; the linked email is what GitHub uses for attribution.

Set these values only for this repository, replacing both placeholders with your actual values:

```sh
git config --local user.name 'YOUR_CONFIRMED_AUTHOR_NAME'
git config --local user.email 'YOUR_VERIFIED_GITHUB_EMAIL_OR_EXACT_GITHUB_NOREPLY_ADDRESS'
git config --local user.useConfigOnly true
git config --show-origin --get user.name
git config --show-origin --get user.email
git var GIT_AUTHOR_IDENT
git var GIT_COMMITTER_IDENT
git branch --show-current
```

Both identities must be yours and the branch must be `feature/organizations-that-can-help`. If an environment overrides the identity (for example with `GIT_AUTHOR_EMAIL`), resolve that before committing. Do not store an access token in Git config or source files. Use your normal GitHub authentication when pushing.

## 2. Commit after review

```sh
npm test
npm run check
python3 tests/browser.py
git add .gitignore README.md package.json index.html assets/index.js assets/organizations-data.js assets/organizations.js assets/organizations-ui.js assets/organizations.css scripts/check.js tests/organizations.test.js tests/browser.py docs/organizations-mvp.md docs/github-review.md docs/pr-body.md
git diff --cached --stat
git diff --cached --check
git commit -m "Add relevant organizations to issue details" -m "AI-assisted implementation, reviewed and approved by the repository owner."
git log -1 --format=fuller
```

Use that review statement only after you have actually reviewed and approved the work. Verify `Author` and `Commit` show your exact configured identity before pushing. No Codex author or co-author is needed. If a local, unpushed commit has the wrong identity, configure the right identity and use `git commit --amend --reset-author --no-edit`. Avoid rewriting already-shared history.

## 3. Push the feature branch and open a pull request

```sh
git push -u origin feature/organizations-that-can-help
gh pr create --repo yenlikiie/aulafix --base main --head feature/organizations-that-can-help --draft --title "Add Organizations That Can Help to issue details" --body-file docs/pr-body.md
```

If GitHub CLI is not installed, open `https://github.com/yenlikiie/aulafix/compare/main...feature/organizations-that-can-help`, choose **Create pull request**, paste `docs/pr-body.md`, and make it a draft. Review the Files changed tab and test results. No direct push to main is needed.

## 4. Approve and merge explicitly

When you approve the PR, mark it **Ready for review**, satisfy any required reviews/checks, then use GitHub's **Create a merge commit** option. This preserves the original commit's author information. Confirm the PR targets `main` in `yenlikiie/aulafix`. Merge only after approval. If squash merging instead, inspect the resulting commit's author/email and the GitHub squash dialog before confirming.

Merging may trigger any repository hosting/automation configured outside this checkout. Review those settings before approving a merge if deployment must remain separate. This MVP itself adds no deployment automation.

## 5. Verify contribution credit

After merging, open the feature commit on GitHub and confirm the author links to **your** GitHub profile. If it does not, check that the commit's exact author email is verified on that account. Check the commit is reachable from the repository's default branch:

```sh
git fetch origin
git log -1 --format=fuller origin/feature/organizations-that-can-help
git merge-base --is-ancestor origin/feature/organizations-that-can-help origin/main
```

The last command returns success after a normal merge that preserves the feature commits. For a squash/rebase merge, inspect the resulting main commit instead because its SHA differs.

GitHub generally credits qualifying commits after they reach the default branch (or `gh-pages`), rather than while they exist only on a feature branch. The author email must be associated with your account; repository/fork and collaboration eligibility rules also apply. Allow up to 24 hours for the contribution graph to update. For private repositories, enable **Contribution settings → Private contributions** on your profile if you want anonymized private contribution counts shown. Authorship attribution, contribution-graph eligibility, and a cryptographic **Verified** signature badge are different things; this feature does not configure commit signing or guarantee graph eligibility.
