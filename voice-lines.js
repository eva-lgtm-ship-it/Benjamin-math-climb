/* =========================================================================
   voice-lines.js — the single source of truth for every recordable line.
   Loaded by BOTH index.html (playback) and record.html (recording studio).
   Add a line here and it shows up in the studio automatically.
   ========================================================================= */

/* Signal words, grouped by what they tell you to do.
   Used for highlighting in the reader AND for the tappable word bank. */
window.SIGNALS = {
  add: ["altogether", "in all", "total", "sum", "both", "combined", "more than", "plus", "joined"],
  sub: ["left", "fewer", "difference", "how many more", "take away", "remaining", "minus", "gave away", "lost", "spent"],
  mul: ["each", "per", "times", "groups of", "every", "double", "twice", "rows of"],
  div: ["share", "split", "equally", "evenly", "half of", "divided", "each group", "cut into"]
};

window.BANK = [
  { key: "add", label: "Put together  +", color: "#17A673", mean: "These words mean the pile gets BIGGER.",              say: "Put together. These words mean the pile gets bigger." },
  { key: "sub", label: "Take away  \u2212", color: "#FF4D3D", mean: "These words mean the pile gets SMALLER.",            say: "Take away. These words mean the pile gets smaller." },
  { key: "mul", label: "Groups of  \u00D7", color: "#2563EB", mean: "These words mean the same amount, over and over.",   say: "Groups of. These words mean the same amount, over and over." },
  { key: "div", label: "Split up  \u00F7", color: "#7C5CFF", mean: "These words mean one pile breaks into fair parts.",   say: "Split up. These words mean one pile breaks into fair parts." }
];

window.STEPS = [
  { id: "step-1", i: "\u{1F442}", t: "Hear it twice",        s: "Listen all the way through. Twice.",            say: "Listen to the whole problem two times before you touch anything." },
  { id: "step-2", i: "\u{1F7E1}", t: "Find the numbers",     s: "Circle every number you see.",                  say: "Find the numbers. Circle every one." },
  { id: "step-3", i: "\u{1F3A8}", t: "Find the do-word",     s: "Which colored word tells you what to do?",      say: "Find the colored word. That word tells you what to do." },
  { id: "step-4", i: "\u270F\uFE0F", t: "Draw it",           s: "Draw a picture before you write any math.",     say: "Draw a picture of what is happening. Draw it before you write any math." },
  { id: "step-5", i: "\u2753", t: "Answer the question",     s: "Read the last line. Did you answer THAT?",      say: "Read the last line again. Did you answer that exact question?" }
];

/* turn "in all" -> "word-in-all" */
window.wordId = function (w) {
  return "word-" + w.toLowerCase().replace(/[^a-z0-9]+/g, "-");
};

/* Build the full recordable manifest. Each entry: {id, text, group} */
window.VOICE_LINES = (function () {
  var lines = [];
  function add(id, text, group) { lines.push({ id: id, text: text, group: group }); }

  add("ui-today-help",  "Tap one block for every 15 minutes of math you finish.", "Buttons and hints");
  add("ui-climb-help",  "Six tests. One for each grade. Tap a test when you pass it.", "Buttons and hints");
  add("ui-reader-help", "Type a word problem in the box. I will read it out loud and color the important words.", "Buttons and hints");
  add("ui-moves-help",  "Do these five moves in order, every single time.", "Buttons and hints");
  add("ui-bank-help",   "Tap any word to hear it.", "Buttons and hints");
  add("ui-count-help",  "How many word problems did you try today? How many did you get right?", "Buttons and hints");

  window.STEPS.forEach(function (s) { add(s.id, s.say, "The five moves"); });

  window.BANK.forEach(function (g) {
    add("bank-" + g.key, g.say, "Word groups");
  });

  window.BANK.forEach(function (g) {
    window.SIGNALS[g.key].forEach(function (w) {
      add(window.wordId(w), w, "Words: " + g.label.split("  ")[0]);
    });
  });

  [3, 4, 5, 6, 7].forEach(function (g) {
    add("praise-grade-" + g, "You passed grade " + g + " math. Next stop, grade " + (g + 1) + ".", "Cheers");
  });
  add("praise-grade-8", "You did it. Grade 8 math.", "Cheers");
  add("praise-full-day", "Four full hours. That is a climbing day.", "Cheers");

  return lines;
})();
