# Godforged — GitHub Pages publishing

This package retains the existing Phase 32 merged game files. `.nojekyll` disables Jekyll processing.

1. In GitHub, create a new public repository named `godforged` under your account.
2. Upload the **contents** of this ZIP to the repository root (not the ZIP itself). Keep the `assets/` and `models/` directories intact.
3. Open repository Settings → Pages → Build and deployment → Deploy from a branch. Select `main` and `/ (root)` and save.
4. When GitHub finishes publishing, open `https://YOUR-USERNAME.github.io/godforged/`.
5. For updates, replace changed files in the same repository. GitHub Pages republishes the same URL.

Note: A public GitHub Pages repository makes its source files public. Browser games cannot securely hide client-side game assets/code. No multiplayer server is included. External JS modules require internet access. Test on iPhone Safari before sharing widely.
