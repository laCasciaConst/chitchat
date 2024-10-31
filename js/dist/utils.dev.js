"use strict";

var italicizeText = function italicizeText(text) {
  return text.replace(/\(([^)]+)\)/g, "<i>($1)</i>");
};

var highlightText = function highlightText(text, searchTerm) {
  var regex = new RegExp("(".concat(searchTerm, ")"), "gi");
  return text.replace(regex, '<span class="highlight">$1</span>');
};

var isEmojiOnly = function isEmojiOnly(text) {
  var emojiRegex = /.../; // Full emoji regex here

  return emojiRegex.test(text.trim());
};

var getMediaPath = function getMediaPath(fileName) {
  var extensions = ["jpg", "jpeg", "png", "gif", "mp4"];
  var fileExtension = fileName.split(".").pop().toLowerCase();

  if (extensions.includes(fileExtension)) {
    return "./src/img/".concat(fileName);
  }

  return fileName;
};