# Community 8-Ball - Reddit's Magical Community Oracle

A magical 8-ball experience that provides community-specific answers based on the Reddit community where it's installed. Ask questions and get mystical responses powered by your subreddit's culture, rules, and collective wisdom!

## ✨ Features

- **🎱 Community-Powered Magic**: Answers are tailored to each Reddit community
- **🎨 Stunning Visual Effects**: Dramatic shaking, particle effects, and magical animations
- **🔊 Immersive Audio**: Procedural sound effects using Web Audio API
- **📱 Premium Mobile Experience**: Responsive design with glass morphism effects
- **📚 Question History**: Track your recent mystical consultations
- **🌟 Accessibility**: Reduced motion support and high contrast modes

## 🎥 Video Tutorial

[![Video Tutorial](docs-img/video-preview.png)](https://www.youtube.com/watch?v=uI85NRCoQNU)

## 🚀 Getting Started

This template is made specifically to work with **Bolt.new**.
Click the button below to open this template directly in Bolt:

<a href="https://bolt.new/github.com/reddit/devvit-bolt-starter-experimental"><img src="docs-img/open-in-bolt-2x.png" heigh="36px" width="199px" alt="Open in Bolt"></a>

As soon as the project is checked out you will get the following errors.
**This is expected**!

```
❌  Authentication: Please run `npm run login` to authenticate with Reddit
❌  App initialization: Please run `npm run devvit:init` to setup your app remotely
❌  Playtest subreddit: Please update YOUR_SUBREDDIT_NAME in the dev:devvit script in package.json
```

### Step 1: Login

In bolt terminal, run

```
npm run login
```

This will authenticate with Reddit. You will be prompted to follow a link and paste an authentication code.
Paste that authentication code in your **terminal window** in Bolt, then press `<Enter>`.

### Step 2: App Initialization

In bolt terminal, run

```
npm run devvit:init
```

This will get your Community 8-Ball app set up with Devvit. You will be prompted to follow a link and paste an authentication code. Paste that authentication code in your **terminal window** in Bolt, then press `<Enter>`.

### Step 3: Playtest subreddit

For this step, you will need to go to Reddit and create an empty subreddit for you to test your app.

You can do this by following going to [Reddit](https://www.reddit.com) and clicking the **"Create a Community"** button in the left-side navigation. Once you create your community, paste the name of the subreddit (for example if you community is reddit.com/r/my_test_subreddit, you will paste `my_test_subreddit`) into the `package.json` file, replacing the string `YOUR_SUBREDDIT_NAME`.

After that, if you run `npm run dev` again, all checks should pass and you should be able to test your application on Reddit.

### Step 4: Testing your Community 8-Ball

Once the initial configuration is done, you can test your application by navigating to your test subreddit, clicking the three dots icon on the top-right and creating a new post. The command will be called `[Community 8-Ball] New Post`. Once you create a new post you can go back and forth with Bolt by prompting your way to making your app and testing it on Reddit.

## 🎮 How It Works

1. **Community Integration**: The 8-Ball generates answers specific to your Reddit community
2. **Mystical Experience**: Ask yes/no questions and receive magical responses
3. **Visual Spectacle**: Enjoy dramatic shaking animations, particle effects, and glowing auras
4. **Audio Immersion**: Experience procedural sound effects during the magical consultation
5. **History Tracking**: View your recent questions and answers

## 🎨 Visual Effects

- **Intense Multi-Phase Shaking**: 3-second dramatic animation with rotation and scaling
- **Magical Particle System**: 20 sparkling particles burst around the ball
- **Floating Emojis**: Mystical symbols float upward during reveals
- **Screen Shake**: Subtle screen movement for maximum immersion
- **Glowing Auras**: Pulsing purple/blue energy around the ball
- **3D Answer Reveals**: Answer window flips in 3D space

## 🔊 Audio Features

- **Shake Sound Effects**: Rumbling audio during the shaking phase
- **Reveal Chimes**: Ascending musical tones when answers appear
- **Web Audio API**: Procedural sound generation for unique experiences

## 🏘️ Community Features

- **Subreddit-Specific Answers**: Responses reference community rules, culture, and members
- **Member Count Integration**: Answers incorporate subscriber statistics
- **Rule-Based Responses**: References to community guidelines and traditions
- **Moderator Mentions**: Special answers that reference community moderation

## 🎯 Perfect For

- **Community Engagement**: Fun way to interact with subreddit culture
- **Decision Making**: Get mystical guidance on community-related questions
- **Entertainment**: Enjoy a premium magical experience
- **Social Sharing**: Create memorable moments to share with the community

Now vibe code away and create magical experiences for Reddit communities!

### Known limitations

- **Only test on your subreddit:** Your app's backend requests will not work on Bolt's preview window. You need to continue to test your app running in your subreddit, where your backend code will work.

- **Use Reddit's backend:** Devvit provides a free of charge scalable backend. Bolt will be able to help you use Reddit's Redis database for key-value storage. You are not going to be able to use other tools such as Supabase for your backend.

- **This is experimental:** While the Devvit team is working to make it as easy as possible to use Bolt for authoring Reddit apps, this is all still in an experimental phase. If you run into issues, please [join our Discord](https://discord.com/invite/Cd43ExtEFS) and ask your questions in **#devvit-vibe-coding**

## 🤝 Contributing

This is an experimental project exploring new ways to build Reddit applications. Feel free to experiment and share your improvements!

## 📄 License

BSD-3-Clause - See LICENSE file for details.