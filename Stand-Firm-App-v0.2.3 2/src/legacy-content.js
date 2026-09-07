/* Stand Firm: curated prototype content. Scripture text is verified World English Bible, public domain.
   Exact excerpts are kept separate from original reflections and application guidance. */
window.StandFirmContent = (() => {
  "use strict";
  const verses = {
    ps46: {
      ref: "Psalm 46:1",
      text: "God is our refuge and strength, a very present help in trouble.",
    },
    ps46still: {
      ref: "Psalm 46:10",
      text: "“Be still, and know that I am God. I will be exalted among the nations. I will be exalted on the earth.”",
    },
    james119: {
      ref: "James 1:19",
      text: "So, then, my beloved brothers, let every man be swift to hear, slow to speak, and slow to anger;",
    },
    eph432: {
      ref: "Ephesians 4:32",
      text: "And be kind to one another, tender hearted, forgiving each other, just as God also in Christ forgave you.",
    },
    col321: {
      ref: "Colossians 3:21",
      text: "Fathers, don’t provoke your children, so that they won’t be discouraged.",
    },
    prov1632: {
      ref: "Proverbs 16:32",
      text: "One who is slow to anger is better than the mighty; one who rules his spirit, than he who takes a city.",
    },
    matt1128: {
      ref: "Matthew 11:28",
      text: "“Come to me, all you who labor and are heavily burdened, and I will give you rest.",
    },
    ps3418: {
      ref: "Psalm 34:18",
      text: "Yahweh is near to those who have a broken heart, and saves those who have a crushed spirit.",
    },
    gal69: {
      ref: "Galatians 6:9",
      text: "Let’s not be weary in doing good, for we will reap in due season if we don’t give up.",
    },
    prov35: {
      ref: "Proverbs 3:5",
      text: "Trust in Yahweh with all your heart, and don’t lean on your own understanding.",
    },
    phil413: {
      ref: "Philippians 4:13",
      text: "I can do all things through Christ who strengthens me.",
    },
    micah68: {
      ref: "Micah 6:8",
      text: "He has shown you, O man, what is good. What does Yahweh require of you, but to act justly, to love mercy, and to walk humbly with your God?",
    },
    ps2714: {
      ref: "Psalm 27:14",
      text: "Wait for Yahweh. Be strong, and let your heart take courage. Yes, wait for Yahweh.",
    },
    isa4110: {
      ref: "Isaiah 41:10",
      text: "Don’t you be afraid, for I am with you. Don’t be dismayed, for I am your God. I will strengthen you. Yes, I will help you. Yes, I will uphold you with the right hand of my righteousness.",
    },
    james122: {
      ref: "James 1:22",
      text: "But be doers of the word, and not only hearers, deluding your own selves.",
    },
    luke1610: {
      ref: "Luke 16:10",
      text: "He who is faithful in a very little is faithful also in much. He who is dishonest in a very little is also dishonest in much.",
    },
    prov1522: {
      ref: "Proverbs 15:22",
      text: "Where there is no counsel, plans fail; but in a multitude of counselors they are established.",
    },
    eccl49: {
      ref: "Ecclesiastes 4:9",
      text: "Two are better than one, because they have a good reward for their labor.",
    },
    ps13923: {
      ref: "Psalm 139:23",
      text: "Search me, God, and know my heart. Try me, and know my thoughts.",
    },
    matt634: {
      ref: "Matthew 6:34",
      text: "Therefore don’t be anxious for tomorrow, for tomorrow will be anxious for itself. Each day’s own evil is sufficient.",
    },
    rom1218: {
      ref: "Romans 12:18",
      text: "If it is possible, as much as it is up to you, be at peace with all men.",
    },
    col323: {
      ref: "Colossians 3:23",
      text: "And whatever you do, work heartily, as for the Lord and not for men,",
    },
    prov2416: {
      ref: "Proverbs 24:16",
      text: "for a righteous man falls seven times and rises up again, but the wicked are overthrown by calamity.",
    },
    heb1024: {
      ref: "Hebrews 10:24",
      text: "Let’s consider how to provoke one another to love and good works,",
    },
    ps905: {
      ref: "Psalm 90:12",
      text: "So teach us to count our days, that we may gain a heart of wisdom.",
    },
    prov425: {
      ref: "Proverbs 4:25",
      text: "Let your eyes look straight ahead. Fix your gaze directly before you.",
    },
    gal522: {
      ref: "Galatians 5:22",
      text: "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faith,",
    },
    mark631: {
      ref: "Mark 6:31",
      text: "He said to them, “Come away into a deserted place, and rest awhile.” For there were many coming and going, and they had no leisure so much as to eat.",
    },
    james15: {
      ref: "James 1:5",
      text: "But if any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach, and it will be given to him.",
    },
    "1pet57": {
      ref: "1 Peter 5:7",
      text: "casting all your worries on him, because he cares for you.",
    },
  };
  const situations = [
    {
      id: "marriage",
      label: "Marriage & relationships",
      hint: "When things are tense at home",
      title: "Choose repair over winning.",
      message:
        "A hard conversation does not have to become a contest. You can speak honestly and still treat your wife or partner with dignity. Listen for what matters beneath the argument. Own your part without taking responsibility for what belongs to someone else.",
      verse: "james119",
      action:
        "Before the next difficult conversation, ask: “What do you need me to understand?” Listen without preparing a rebuttal. Then share your perspective calmly.",
      prayer:
        "Lord, help me listen before I defend myself. Give me humility to own my mistakes and courage to speak the truth with love. Amen.",
    },
    {
      id: "fatherhood",
      label: "Fatherhood",
      hint: "Patience, presence, and guidance",
      title: "Your presence is part of your strength.",
      message:
        "Children need guidance, consistency, and a father who can repair after getting something wrong. A difficult day does not require a perfect speech. Show up, listen, and let your actions teach what your words cannot.",
      verse: "col321",
      action:
        "Give your child ten minutes of undivided attention. Ask one question about their world and let them finish. If you owe an apology, make it without excuses.",
      prayer:
        "Father, give me patience and wisdom with my children. Help me lead with love, set healthy boundaries, and be willing to repair what I damage. Amen.",
    },
    {
      id: "anger",
      label: "Anger & frustration",
      hint: "When you feel close to losing control",
      title: "Strength includes self-control.",
      message:
        "Anger can tell you something matters, but it does not get to choose your actions. You can take a break, lower the temperature, and return to the issue with a clearer mind. Walking away from an escalating argument is not surrender.",
      verse: "prov1632",
      action:
        "Put distance between yourself and the argument if needed. Do not send the message or make the decision while you are heated. Return when you can speak without threatening or humiliating anyone.",
      prayer:
        "God, help me govern my actions when my emotions run high. Give me a steady mind, honest words, and the discipline to do no harm. Amen.",
    },
    {
      id: "stress",
      label: "Stress & overwhelm",
      hint: "When everything is happening at once",
      title: "Carry the next thing, not every thing.",
      message:
        "You do not have to solve your whole life in one sitting. Some responsibilities are urgent, some can wait, and some require another person. You can be capable and still need rest or support.",
      verse: "matt1128",
      action:
        "Write down the three things weighing on you. Identify the one that truly needs attention today. Take its smallest useful step, and ask for help with something you cannot carry alone.",
      prayer:
        "Lord, help me distinguish what matters now from what can wait. Give me peace, wisdom, and the willingness to accept help. Amen.",
    },
    {
      id: "grief",
      label: "Grief & loss",
      hint: "When someone or something is missing",
      title: "You do not have to rush your grief.",
      message:
        "There is no requirement to turn loss into a lesson before you are ready. Grief can be honest, complicated, and slow. Make room for your memories and let trusted people stand beside you.",
      verse: "ps3418",
      action:
        "Reach out to one trusted person. Tell them what you miss or what today feels like. If you have no words, simply ask them to sit with you or check in.",
      prayer:
        "God, meet me in the places where words are difficult. Hold what I cannot fix, and help me receive the care of people who love me. Amen.",
    },
    {
      id: "purpose",
      label: "Purpose & direction",
      hint: "When you feel stuck or uncertain",
      title: "You can move without seeing the whole road.",
      message:
        "Purpose is not always a sudden revelation. Sometimes it is built through faithful, ordinary choices. You do not have to know the entire destination to decide what kind of man you want to be today.",
      verse: "micah68",
      action:
        "Write one sentence describing the man you want to become. Choose one action today that supports it: serve someone, learn a skill, repair a relationship, or finish a responsibility.",
      prayer:
        "Lord, guide my decisions and help me recognize what is mine to do. Give me courage to act with justice, mercy, and humility. Amen.",
    },
    {
      id: "discipline",
      label: "Discipline & fitness",
      hint: "When you need to get moving again",
      title: "Start smaller. Stay consistent.",
      message:
        "Discipline is not punishment for yesterday. It is a commitment you can keep today. Build a routine that fits your actual health, responsibilities, and capacity. Progress does not require ignoring pain or pushing through medical limits.",
      verse: "gal69",
      action:
        "Choose one realistic habit and complete it today. It might be a short walk, a healthy meal, stretching, or ten minutes of focused work. If you have medical restrictions, follow your care team’s guidance.",
      prayer:
        "God, help me use the strength and time I have wisely. Teach me patience with the process and consistency in the small things. Amen.",
    },
    {
      id: "faith",
      label: "Faith & doubt",
      hint: "When you feel distant from God",
      title: "You can bring your questions to God.",
      message:
        "Doubt and exhaustion do not require a performance of certainty. You can pray honestly, read Scripture in context, and seek conversation with a trusted pastor or mature believer. A difficult season need not be faced in isolation.",
      verse: "prov35",
      action:
        "Set aside five quiet minutes. Read Proverbs 3:5–6 in context, write down one question you are carrying, and consider sharing it with someone you trust in your faith community.",
      prayer:
        "Lord, meet me in my questions. Give me wisdom, patience, and the courage to seek truth without pretending I have every answer. Amen.",
    },
    {
      id: "work",
      label: "Work & finances",
      hint: "Pressure, setbacks, and uncertainty",
      title: "Make a plan before the pressure makes one for you.",
      message:
        "Financial and work problems can make the future feel smaller. Separate what is known from what is feared. Make decisions from the facts you have, and seek qualified help when the situation calls for it.",
      verse: "ps2714",
      action:
        "List your immediate obligations and available resources. Choose one practical action: contact a creditor, review a budget, update your résumé, or ask a knowledgeable person for advice.",
      prayer:
        "God, give me wisdom with my resources and patience in uncertainty. Help me work honestly, seek help when needed, and care for those who depend on me. Amen.",
    },
    {
      id: "loneliness",
      label: "Loneliness & discouragement",
      hint: "When you feel disconnected",
      title: "Connection is worth reaching for.",
      message:
        "You can be surrounded by responsibilities and still feel alone. Isolation can make a hard season heavier. You do not have to have a polished explanation before reaching out to someone you trust.",
      verse: "ps46",
      action:
        "Contact one person and ask for a real conversation or time together. If you have been withdrawing, choose one small way to reconnect with your community.",
      prayer:
        "Lord, help me reach toward the people who care about me. Give me courage to be honest and openness to receive support. Amen.",
    },
    {
      id: "forgiveness",
      label: "Forgiveness & mistakes",
      hint: "When you need to make something right",
      title: "Accountability is a form of courage.",
      message:
        "You cannot undo yesterday, but you can take responsibility for what happened and choose what comes next. Forgiveness does not erase necessary boundaries or require anyone to accept unsafe behavior. Repair begins with honesty and change.",
      verse: "eph432",
      action:
        "Identify one thing you need to own. If it is safe and appropriate, offer a specific apology without excuses. Ask what repair would look like, then follow through.",
      prayer:
        "God, show me where I need to change. Give me humility to admit wrong, wisdom to respect boundaries, and perseverance to make things right. Amen.",
    },
    {
      id: "decision",
      label: "A difficult decision",
      hint: "When the right path is unclear",
      title: "Choose from clarity, not urgency.",
      message:
        "You may have more than one reasonable option. Seek facts, consider the consequences, and give yourself time where time is available. Faith and careful reasoning can work together.",
      verse: "prov35",
      action:
        "Write down your options, what is verified, what is uncertain, and the risks of each. Speak with a trusted, qualified person if the decision has serious legal, medical, or financial consequences.",
      prayer:
        "Lord, give me wisdom to see clearly and courage to act responsibly. Help me seek good counsel and avoid decisions driven only by fear. Amen.",
    },
  ];
  const daily = [
    {
      title: "Begin again.",
      reflection:
        "You do not have to become a different man overnight. Start where you are. Faithfulness is built in the choices you make when no one is watching.",
      verse: "gal69",
      action:
        "Choose one meaningful thing you have been putting off. Give it ten focused minutes today.",
    },
    {
      title: "Listen first.",
      reflection:
        "The strongest voice in a room is not always the loudest. Listening can be an act of courage, especially when you disagree.",
      verse: "james119",
      action:
        "Give someone your full attention today. Ask one question before offering your opinion.",
    },
    {
      title: "Keep your word.",
      reflection:
        "Integrity grows when your actions match what you say matters. Start with one commitment you can actually keep.",
      verse: "micah68",
      action:
        "Make one realistic promise to yourself or someone else, and follow through on it.",
    },
    {
      title: "Make room for rest.",
      reflection:
        "Rest is not the opposite of responsibility. It is part of sustaining a life of responsibility. You are allowed to recover.",
      verse: "matt1128",
      action:
        "Set aside a short period for genuine rest without turning it into another performance target.",
    },
    {
      title: "Repair what you can.",
      reflection:
        "Pride can keep a small mistake alive for years. Humility gives you room to acknowledge it and make a different choice.",
      verse: "eph432",
      action:
        "If you owe someone an apology, take one appropriate step toward repair today.",
    },
    {
      title: "Take the next step.",
      reflection:
        "You do not need perfect circumstances to begin. Steady, wise action can be more useful than waiting for certainty.",
      verse: "ps2714",
      action:
        "Identify one task that moves an important goal forward. Make it small enough to finish today.",
    },
    {
      title: "Be present.",
      reflection:
        "The people you love need more than your plans for the future. They need moments of your attention now.",
      verse: "col321",
      action:
        "Put your phone aside and spend ten intentional minutes with someone who matters to you.",
    },
  ];
  return Object.freeze({ verses, situations, daily });
})();
