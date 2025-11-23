Place the provided "serious cat" image here so the app will use it.

Filename:
- `serious-cat.jpg`

How to add the image:
- Save the attached image from the chat as `serious-cat.jpg`.
- Put it in this `public` folder: `Cat-Meme-Cam/public/serious-cat.jpg`.

Quick PowerShell step (if you have the image saved elsewhere):

```powershell
# Replace the source path with where you saved the image
Copy-Item -Path "C:\path\to\downloaded\serious-cat.jpg" -Destination "C:\Users\verga\cat-app\Cat-Meme-Cam\public\serious-cat.jpg"
```

Why this path:
- Vite serves files in `public` at the project root, so the image becomes available at `/serious-cat.jpg`.

If you'd like, upload the image into the workspace and I can add it for you automatically.