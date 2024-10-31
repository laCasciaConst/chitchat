"use strict";

$(document).ready(function () {
  var chatContainer = $("#chat-container");
  var searchInput = $("#search-input");
  var dateSelector = $("#date-selector");
  var tooltip = $("#tooltip");
  var calendarContainer = $("#calendar-container");
  var chatContainerWrapper = $(".outer-container");
  var searchToggleButton = $("#search-toggle-button");
  var dropdownContainer = $("#dropdown-container");
  var logSelector = $("#log-selector");
  var outerContainerWidth = $(".outer-container").width();
  var quoteBoxMaxWidth = outerContainerWidth * 0.7; // let clickPosition = { top: 0, left: 0 };

  var lastSearchTerm = ""; // Datepicker 초기화

  $("#datepicker").datepicker({
    dateFormat: "yy-mm-dd",
    beforeShowDay: function beforeShowDay(date) {
      var dateString = $.datepicker.formatDate("yy-mm-dd", date);
      return [Object.keys(chatLogs).some(function (logDate) {
        return logDate.includes(dateString);
      }), "", Object.keys(chatLogs).some(function (logDate) {
        return logDate.includes(dateString);
      }) ? "Has events" : ""];
    },
    onSelect: function onSelect(dateText, inst) {
      var selectedDate = dateText;
      var logsForDate = Object.keys(chatLogs).filter(function (logDate) {
        return logDate.includes(selectedDate);
      });
      var datepickerOffset = $("#datepicker").offset();
      var inputHeight = $("#datepicker").outerHeight();
      var selectedTd = $(inst.dpDiv).find(".ui-datepicker-current-day");

      if (selectedTd.length === 0) {
        setTimeout(function () {
          selectedTd = $(inst.dpDiv).find(".ui-datepicker-current-day");
          handleTdSelection(selectedTd, logsForDate, selectedDate);
        }, 10);
      } else {
        handleTdSelection(selectedTd, logsForDate, selectedDate);
      }
    }
  });

  function handleTdSelection(selectedTd, logsForDate, selectedDate) {
    var offset, tdHeight;

    if (selectedTd.length > 0) {
      offset = selectedTd.offset();
      tdHeight = selectedTd.outerHeight();
      clickPosition = {
        top: offset.top + tdHeight,
        left: offset.left
      };
    }

    console.log("Selected TD Offset: ", offset);
    console.log("Selected TD Height: ", tdHeight);

    if (logsForDate.length > 1 && offset) {
      logSelector.empty();
      logsForDate.forEach(function (log) {
        var row = $("<tr></tr>");
        var cell = $("<td></td>").attr("value", log).text(log.split(", ")[0]);
        row.append(cell);
        logSelector.append(row);
      });
      dropdownContainer.css({
        position: "absolute",
        bottom: offset.top - 500 + "px",
        left: offset.left / 3 + 45 + "px"
      }).show();
    } else {
      dropdownContainer.hide();
      dateSelector.val(logsForDate[0] || selectedDate).change();
      calendarContainer.hide();
      chatContainerWrapper.show().css("visibility", "visible");
      searchToggleButton.show();
    }
  }

  logSelector.on("click", "td", function () {
    var selectedLog = $(this).attr("value");
    dateSelector.val(selectedLog).change();
    dropdownContainer.hide();
    calendarContainer.hide();
    chatContainerWrapper.show().css("visibility", "visible");
    searchToggleButton.show();
  });

  var appendDateDivider = function appendDateDivider(timestamp) {
    if (!timestamp) return;
    var lastDivider = chatContainer.children(".date-divider").last();

    if (lastDivider.length === 0 || lastDivider.text() !== timestamp) {
      var dateDivider = $("<div></div>").addClass("date-divider").html("<span>".concat(timestamp, "</span>"));

      if (chatContainer.children(".date-divider").length === 0) {
        dateDivider.addClass("first");
      }

      chatContainer.append(dateDivider);
    }
  }; // 날짜 선택 옵션 생성


  Object.keys(chatLogs).forEach(function (date) {
    var option = $("<option></option>").attr("value", date).text(date);
    dateSelector.append(option);
  });

  var italicizeText = function italicizeText(text) {
    return text.replace(/\(([^)]+)\)/g, "<i>($1)</i>");
  };

  var highlightText = function highlightText(text, searchTerm) {
    var regex = new RegExp("(".concat(searchTerm, ")"), "gi");
    return text.replace(regex, '<span class="highlight">$1</span>');
  };

  var isEmojiOnly = function isEmojiOnly(text) {
    var emojiRegex = /^(?:(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u2660\u2663\u2665\u2666\u2668\u267B\u267F\u2692-\u2694\u2696\u2697\u2699\u269B\u269C\u26A0\u26A1\u26A7\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F\uDE80-\uDEF6\uDFE0-\uDFEB\uDFED-\uDFFF]|\uD83E[\uDD00-\uDDE6])|[\u200D\u20E3\uFE0F])+$/;
    return emojiRegex.test(text.trim());
  };

  var getMediaPath = function getMediaPath(fileName) {
    var extensions = ["jpg", "jpeg", "png", "gif", "mp4"];
    var fileExtension = fileName.split(".").pop().toLowerCase();

    if (extensions.includes(fileExtension)) {
      return "./src/img/".concat(fileName);
      console.log("File path: ".concat(path));
      return path;
    }

    return fileName;
  };

  var getDataTipPath = function getDataTipPath(dataTip) {
    var extensions = ["jpg", "jpeg", "png", "gif"];
    var fileExtension = dataTip.split(".").pop().toLowerCase();

    if (extensions.includes(fileExtension)) {
      return "./src/dataTip/".concat(dataTip);
    }

    return dataTip;
  };

  var getDataTipContent = function getDataTipContent(dataTip) {
    var content = "";

    if (dataTip.image) {
      var imagePath = getDataTipPath(dataTip.image);
      content += "<img src=\"".concat(imagePath, "\" alt=\"dataTip image\">");
    }

    if (dataTip.text) {
      var formattedText = dataTip.text.replace(/\*(.*?)\*/g, "<i>$1</i>").replace(/\\/g, "<br>");
      content += "<span>".concat(formattedText, "</span>");
    }

    return content;
  };

  var processMessage = function processMessage(message) {
    Object.keys(emojiMap).forEach(function (code) {
      var emojiImage = emojiMap[code];

      if (message.includes(code)) {
        console.log("Replacing ".concat(code, " with ").concat(emojiImage));
      }

      message = message.replace(new RegExp(code, "g"), emojiImage);
    });
    return message;
  };

  var displayChatLog = function displayChatLog() {
    var searchTerm = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    var selectedDate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
    var scrollToElement = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    console.log("displayChatLog called with:", searchTerm, selectedDate, scrollToElement); // 디버깅용 콘솔 로그

    chatContainer.empty(); // 기존 메시지 지우기

    if (!selectedDate) {
      selectedDate = dateSelector.val();
    }

    if (!selectedDate && !searchTerm) {
      return;
    }

    var chatLog = chatLogs[selectedDate];
    appendDateDivider(selectedDate);
    var lastSender = ""; // 마지막으로 메시지를 보낸 사람을 추적

    var lastTimestamp = ""; // 마지막으로 추가된 타임스탬프를 추적

    if (searchTerm) {
      var matchingMessages = [];
      Object.keys(chatLogs).forEach(function (date) {
        var chatLog = chatLogs[date];

        if (chatLog) {
          chatLog.forEach(function (chat, index) {
            if (!chat.quote && chat.message.toLowerCase().includes(searchTerm.toLowerCase())) {
              matchingMessages.push({
                date: date,
                chat: chat,
                index: index
              });
            }
          });
        }
      });
      var lastDate = null; // 마지막으로 추가된 date-divider의 날짜

      matchingMessages.forEach(function (_ref, i) {
        var date = _ref.date,
            chat = _ref.chat,
            index = _ref.index;

        if (lastDate !== date) {
          appendDateDivider(date);
          lastDate = date;
        }

        var senderClass = chat.sender === "J" ? "friend" : "me";
        var messageContainer = $("<div></div>").addClass("message-container").addClass(senderClass);
        var messageDiv;

        if (chat.sender === "J" && chat.sender !== lastSender) {
          var nicknameSpan = $("<span></span>").addClass("nickname").addClass(senderClass).text(chat.sender);
          messageContainer.append(nicknameSpan);
        } else {
          messageContainer.addClass("no-nickname");
        }

        var mediaPath = getMediaPath(chat.message);

        if (mediaPath.endsWith(".jpg") || mediaPath.endsWith(".png") || mediaPath.endsWith(".gif")) {
          messageDiv = $("<img>").attr("src", mediaPath).addClass("rounded-media");
        } else if (mediaPath.endsWith(".mp4")) {
          messageDiv = $("<video controls>").attr("src", mediaPath).addClass("rounded-media");
        } else if (isEmojiOnly(chat.message)) {
          messageDiv = $("<div></div>").addClass("emoji").text(chat.message);
        } else {
          messageDiv = $("<div></div>").addClass("message").addClass(senderClass);
          var formattedMessage = italicizeText(chat.message).replace(/\\/g, "<br>");
          var highlightedMessage = highlightText(formattedMessage, searchTerm);
          var messageText = $("<span></span>").html(highlightedMessage);
          messageDiv.append(messageText);
        }

        if (chat.dataTip) {
          var dataTipContent = getDataTipContent(chat.dataTip);
          messageDiv.attr("data-tip", dataTipContent);
          var highlightCircle = $("<div></div>").addClass("highlight-circle");
          messageContainer.append(highlightCircle);
          messageDiv.hover(function (event) {
            if ($(this).attr("data-tip")) {
              tooltip.html($(this).attr("data-tip"));
              tooltip.css({
                top: event.pageY + 10 + "px",
                left: event.pageX + 10 + "px"
              });
              tooltip.show();
            }
          }, function () {
            tooltip.hide();
          });
        }

        messageContainer.append(messageDiv);

        if (chat.reaction) {
          var reactionBox = $("<div></div>").addClass("reaction-box");
          var reactionIcon = $("<span></span>").addClass("reaction-icon").text(chat.reaction);
          reactionBox.append(reactionIcon);
          messageContainer.append(reactionBox);
          messageContainer.addClass("has-reaction");
        }

        chatContainer.append(messageContainer); // 이벤트 핸들러 추가: 검색 결과 메시지 클릭 시 해당 날짜로 이동

        messageContainer.on("click", function () {
          console.log("Message clicked:", date); // 디버깅용 콘솔 로그

          dateSelector.val(date).change();
          displayChatLog("", date, messageContainer);
        });
        lastSender = chat.sender;

        if (chat.timestamp && chat.timestamp !== lastTimestamp) {
          appendTimestampLabel(chat.timestamp);
          lastTimestamp = chat.timestamp;
        }
      });

      if (matchingMessages.length > 0) {
        if (matchingMessages[matchingMessages.length - 1].chat.reaction) {
          chatContainer.children().last().css("margin-bottom", "0");
        }
      }
    } else {
      chatLog.forEach(function (chat, index) {
        var senderClass = chat.sender === "J" ? "friend" : "me";
        var messageContainer = $("<div></div>").addClass("message-container").addClass(senderClass);
        var messageDiv = $("<div></div>").addClass("message").addClass(senderClass);
        var processedMessage = processMessage(chat.message);
        var messageText = $("<span></span>").html(processedMessage);
        messageDiv.append(messageText);

        if (chat.sender === "J" && chat.sender !== lastSender) {
          var nicknameSpan = $("<span></span>").addClass("nickname").addClass(senderClass).text(chat.sender);
          messageContainer.append(nicknameSpan);
        } else {
          messageContainer.addClass("no-nickname");
        }

        if (chat.quote) {
          var quoteBox = $("<div></div>").addClass("quote-box").css("max-width", quoteBoxMaxWidth);
          var quoteText = $("<span></span>").addClass("quote-text").text(chat.quote);
          quoteBox.append(quoteText);
          messageContainer.append(quoteBox);
          messageContainer.addClass("has-quote");
        }

        var mediaPath = getMediaPath(chat.message);

        if (mediaPath.endsWith(".jpg") || mediaPath.endsWith(".png") || mediaPath.endsWith(".gif")) {
          messageDiv = $("<img>").attr("src", mediaPath).addClass("rounded-media");
        } else if (mediaPath.endsWith(".mp4")) {
          messageDiv = $("<video controls>").attr("src", mediaPath).addClass("rounded-media");
        } else if (isEmojiOnly(chat.message)) {
          messageDiv = $("<div></div>").addClass("emoji").text(chat.message);
        } else {
          messageDiv = $("<div></div>").addClass("message").addClass(senderClass);
          var formattedMessage = italicizeText(chat.message).replace(/\\/g, "<br>");

          var _messageText = $("<span></span>").html(formattedMessage);

          messageDiv.append(_messageText);

          if (chat.dataTip) {
            var dataTipContent = getDataTipContent(chat.dataTip);
            messageDiv.attr("data-tip", dataTipContent);
            var highlightCircle = $("<div></div>").addClass("highlight-circle");
            messageContainer.append(highlightCircle);
            messageDiv.hover(function (event) {
              if ($(this).attr("data-tip")) {
                tooltip.html($(this).attr("data-tip"));
                tooltip.css({
                  top: event.pageY + 10 + "px",
                  left: event.pageX + 10 + "px"
                });
                tooltip.show();
              }
            }, function () {
              tooltip.hide();
            });
          }
        }

        messageContainer.append(messageDiv);

        if (chat.reaction) {
          var reactionBox = $("<div></div>").addClass("reaction-box");
          var reactionIcon = $("<span></span>").addClass("reaction-icon").text(chat.reaction);
          reactionBox.append(reactionIcon);
          messageContainer.append(reactionBox);
          messageContainer.addClass("has-reaction");
        }

        chatContainer.append(messageContainer);

        if (chat.quote) {
          var nicknameHeight = messageContainer.find(".nickname").outerHeight() || 0;
          var quoteHeight = messageContainer.find(".quote-box").outerHeight() || 0;
          var messageHeight = messageDiv.outerHeight() || 0;
          var totalHeight = nicknameHeight + quoteHeight + messageHeight - 20;
          messageContainer.css("height", "".concat(totalHeight, "px"));
        }

        if (index === chatLog.length - 1) {
          messageContainer.addClass("last-message");

          if (!messageContainer.find(".reaction-box").length) {
            if (messageContainer.width() < 120) {
              chatContainer.css("height", "calc(100% - 20px)");
              messageContainer.addClass("no-height-adjust").removeClass("height-adjusted");
              messageContainer.find(".timestamp-label").css("top", "0px");
            } else {
              chatContainer.css("height", "100%");
              messageContainer.addClass("height-adjusted").removeClass("no-height-adjust");
              messageContainer.find(".timestamp-label").css("top", "20px");
            }
          } else {
            if (messageContainer.width() < 120) {
              chatContainer.css("height", "calc(100% - 20px)");
              messageContainer.addClass("no-height-adjust has-reaction").removeClass("height-adjusted");
              messageContainer.find(".timestamp-label").css("top", "0px");
            } else {
              chatContainer.css("height", "100%");
              messageContainer.addClass("height-adjusted has-reaction long-message").removeClass("no-height-adjust");
              messageContainer.find(".timestamp-label").css("top", "20px");
            }
          }
        }

        if (chat.timestamp) {
          appendTimestampLabel(chat.timestamp); // messageContainer에 타임스탬프 추가

          lastTimestamp = chat.timestamp; // 마지막 타임스탬프 업데이트
        }

        lastSender = chat.sender;
      });

      if (chatLog.length > 0) {
        if (chatLog[chatLog.length - 1].reaction) {
          chatContainer.children().last().css("margin-bottom", "0");
        }
      } // 스크롤할 요소가 지정된 경우 스크롤


      if (scrollToElement) {
        setTimeout(function () {
          scrollToMessage(scrollToElement);
        }, 100);
      }
    }
  };

  var scrollToMessage = function scrollToMessage(messageElement) {
    var container = chatContainer[0];
    var containerHeight = container.clientHeight;
    var messageTop = messageElement.offsetTop;
    var messageHeight = messageElement.clientHeight;
    var scrollPosition = messageTop - containerHeight / 2 + messageHeight / 2;
    container.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });
  };

  var appendTimestampLabel = function appendTimestampLabel(timestamp) {
    if (!timestamp) return;
    var lastMessage = chatContainer.children().last();
    var lastTimestampLabel = lastMessage.find(".timestamp-label").text();

    if (lastTimestampLabel !== timestamp) {
      var timestampLabel = $("<div></div>").addClass("timestamp-label").text(timestamp);
      lastMessage.append(timestampLabel);
    }
  };

  searchInput.on("input", function () {
    var searchTerm = $(this).val();
    dateSelector.val("");
    displayChatLog(searchTerm);
  });
  dateSelector.change(function () {
    var selectedDate = $(this).val();
    console.log("Date selected:", selectedDate); // 디버깅용 콘솔 로그

    displayChatLog("", selectedDate); // selectedDate를 매개변수로 전달
  });
  searchToggleButton.click(function () {
    searchInput.toggle();
  });
  displayChatLog();
});