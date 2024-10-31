"use strict";

var appendDateDivider = function appendDateDivider(timestamp) {
  if (!timestamp) return;
  var lastDivider = $("#chat-container").children(".date-divider").last();

  if (lastDivider.length === 0 || lastDivider.text() !== timestamp) {
    var dateDivider = $("<div></div>").addClass("date-divider").html("<span>".concat(timestamp, "</span>"));
    $("#chat-container").append(dateDivider);
  }
};

var displayChatLog = function displayChatLog() {
  var searchTerm = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
  var selectedDate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  var scrollToElement = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  // 초기 설정
  $("#chat-container").empty();
  $("#no-results").hide();
  $("#search-toggle-button").css("display", "block");

  if (!selectedDate) {
    selectedDate = $("#date-selector").val();
  }

  if (!selectedDate && !searchTerm) {
    return;
  }

  var chatLog = chatLogs[selectedDate];

  if (!chatLog && !searchTerm) {
    $("#no-results").show();
    return;
  }

  appendDateDivider(selectedDate);
  var lastSender = ""; // 마지막 메시지 보낸 사람 추적

  var lastTimestamp = ""; // 마지막 타임스탬프 추적

  var logKeys = Object.keys(chatLogs).filter(function (key) {
    return key.startsWith(selectedDate);
  });

  if (logKeys.length > 1 && !scrollToElement && !searchTerm) {
    showMenuForDate($("#calendar-container td.has-events[data-logs='".concat(selectedDate, "']")), logKeys);
    return;
  }

  var matchingMessages = [];

  if (searchTerm) {
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

    if (matchingMessages.length === 0) {
      console.log("No results found");
      $("#no-results").show();
      return;
    }

    var lastDate = null; // 마지막으로 추가된 date-divider의 날짜

    matchingMessages.forEach(function (_ref, i) {
      var date = _ref.date,
          chat = _ref.chat,
          index = _ref.index;

      if (lastDate !== date) {
        appendDateDivider(date);
        lastDate = date;
      }

      var senderClass = chat.sender !== "L" ? "friend" : "me";
      var messageContainer = $("<div></div>").addClass("message-container").addClass(senderClass); // 클래스 추가

      if (chat["class"]) {
        chat["class"].split(",").forEach(function (className) {
          messageContainer.addClass(className.trim());
        });
      }

      if (chat.sender !== "L" && chat.sender !== lastSender) {
        var nicknameSpan = $("<span></span>").addClass("nickname").addClass(senderClass).text(chat.sender);
        messageContainer.append(nicknameSpan);
      } else {
        messageContainer.addClass("no-nickname");
      }

      var messageDiv = $("<div></div>").addClass("message").addClass(senderClass);
      var mediaPath = getMediaPath(chat.message);

      if (chat["class"] && chat["class"].includes("two-image")) {
        var images = chat.message.split("\\"); // 이미지를 '\\'로 분리

        var imageContainer = $("<div></div>").addClass("image-container").css({
          display: "flex",
          // 이미지를 가로로 나란히 배치
          gap: "15px" // 이미지 사이에 15px 간격

        });
        images.forEach(function (image) {
          var imagePath = getMediaPath(image.trim());
          var imageElement = $("<img>").attr("src", imagePath).addClass("rounded-media").css({
            maxWidth: "calc(50% - 7.5px)",
            // 두 이미지를 나란히 배치
            height: "auto"
          });
          imageContainer.append(imageElement);
        });
        messageContainer.append(imageContainer);
      } else {
        var _mediaPath = getMediaPath(chat.message);

        if (_mediaPath.endsWith(".jpg") || _mediaPath.endsWith(".png") || _mediaPath.endsWith(".gif")) {
          messageDiv = $("<img>").attr("src", _mediaPath).addClass("rounded-media");
          messageContainer.append(messageDiv);
        } else if (_mediaPath.endsWith(".mp4")) {
          messageDiv = $("<video controls>").attr("src", _mediaPath).addClass("rounded-media");
          messageContainer.append(messageDiv);
        } else if (isEmojiOnly(chat.message)) {
          messageDiv = $("<div></div>").addClass("emoji").text(chat.message);
          messageContainer.append(messageDiv);
        } else {
          var formattedMessage = italicizeText(chat.message).replace(/\\/g, "<br>");
          var highlightedMessage = highlightText(formattedMessage, searchTerm) || formattedMessage;
          var messageText = $("<span></span>").html(highlightedMessage);
          messageDiv.append(messageText);
          messageContainer.append(messageDiv);
        }
      } // 데이터 팁 및 반응 처리


      if (chat.dataTip) {
        var dataTipContent = getDataTipContent(chat.dataTip);
        messageDiv.attr("data-tip", dataTipContent);
        var highlightCircle = $("<div></div>").addClass("highlight-circle");
        messageContainer.append(highlightCircle);
        messageDiv.hover(function (event) {
          if ($(this).attr("data-tip")) {
            $("#tooltip").html($(this).attr("data-tip"));
            $("#tooltip").css({
              top: event.pageY + 10 + "px",
              left: event.pageX + 10 + "px"
            });
            $("#tooltip").show();
          }
        }, function () {
          $("#tooltip").hide();
        });
      }

      if (chat.reaction) {
        var reactionBox = $("<div></div>").addClass("reaction-box");
        var reactionIcon = $("<span></span>").addClass("reaction-icon").text(chat.reaction);
        reactionBox.append(reactionIcon);
        messageContainer.append(reactionBox);
        messageContainer.addClass("has-reaction");
      }

      $("#chat-container").append(messageContainer); // 이벤트 핸들러 추가: 검색 결과 메시지 클릭 시 해당 날짜로 이동

      messageContainer.on("click", function () {
        console.log("Message clicked:", date); // 디버깅용 콘솔 로그

        $("#date-selector").val(date).change();
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
        $("#chat-container").children().last().css("margin-bottom", "0");
      }
    }
  } else {
    chatLog.forEach(function (chat, index) {
      var senderClass = chat.sender !== "L" ? "friend" : "me";
      var messageContainer = $("<div></div>").addClass("message-container").addClass(senderClass);

      if (chat["class"]) {
        chat["class"].split(",").forEach(function (className) {
          messageContainer.addClass(className.trim());
        });
      }

      var messageDiv = $("<div></div>").addClass("message").addClass(senderClass);
      var processedMessage = processMessage(chat.message);
      var isAppleStyle = processedMessage.includes("✉️");

      if (isAppleStyle) {
        messageDiv.addClass("apple-style"); // 이모지를 제거하여 메시지를 깔끔하게 유지

        processedMessage = processedMessage.replace(/✉️/g, "");
        var messageText = $("<span></span>").html(processedMessage);
        messageDiv.append(messageText);
        messageContainer.append(messageDiv);
        var nextChat = chatLog[index + 1];
        var isLastInGroup = !nextChat || nextChat.sender !== chat.sender;

        if (isLastInGroup) {
          if (senderClass === "me") {
            messageDiv.css("border-radius", "28px 28px 5px 28px");
          } else {
            messageDiv.css("border-radius", "28px 28px 28px 5px");
          }
        } else {
          messageDiv.css("border-radius", "28px");
        } // 애플 메시지 스타일 적용 후 다른 처리를 하지 않도록 종료


        $("#chat-container").append(messageContainer);
        return;
      }

      if (chat.sender !== "L" && chat.sender !== lastSender) {
        var nicknameSpan = $("<span></span>").addClass("nickname").addClass(senderClass).text(chat.sender);
        messageContainer.append(nicknameSpan);
      } else {
        messageContainer.addClass("no-nickname");
      } // 위와 동일하게 이미지를 처리


      var mediaPath = getMediaPath(chat.message);

      if (chat["class"] && chat["class"].includes("two-image")) {
        var images = chat.message.split("\\");
        var imageContainer = $("<div></div>").addClass("two-image");
        images.forEach(function (image) {
          var imagePath = getMediaPath(image.trim());
          var imageElement = $("<img>").attr("src", imagePath).css({
            maxWidth: "calc((100% - 15px) / 2)",
            height: "auto"
          });
          imageContainer.append(imageElement);
        });
        messageContainer.append(imageContainer);
      } else if (mediaPath.endsWith(".jpg") || mediaPath.endsWith(".png") || mediaPath.endsWith(".gif")) {
        messageDiv = $("<img>").attr("src", mediaPath).addClass("rounded-media");
        messageContainer.append(messageDiv);
      } else if (mediaPath.endsWith(".mp4")) {
        messageDiv = $("<video controls>").attr("src", mediaPath).addClass("rounded-media");
        messageContainer.append(messageDiv);
      } else if (isEmojiOnly(chat.message)) {
        messageDiv = $("<div></div>").addClass("emoji").text(chat.message);
        messageContainer.append(messageDiv);
      } else {
        var formattedMessage = italicizeText(chat.message).replace(/\\/g, "<br>");

        var _messageText = $("<span></span>").html(formattedMessage);

        messageDiv.append(_messageText);
        messageContainer.append(messageDiv);
      }

      if (chat.dataTip) {
        var dataTipContent = getDataTipContent(chat.dataTip);
        messageDiv.attr("data-tip", dataTipContent);
        var highlightCircle = $("<div></div>").addClass("highlight-circle");
        messageContainer.append(highlightCircle);
        messageDiv.hover(function (event) {
          if ($(this).attr("data-tip")) {
            $("#tooltip").html($(this).attr("data-tip"));
            $("#tooltip").css({
              top: event.pageY + 10 + "px",
              left: event.pageX + 10 + "px"
            });
            $("#tooltip").show();
          }
        }, function () {
          $("#tooltip").hide();
        });
      }

      if (chat.reaction) {
        var reactionBox = $("<div></div>").addClass("reaction-box");
        var reactionIcon = $("<span></span>").addClass("reaction-icon").text(chat.reaction);
        reactionBox.append(reactionIcon);
        messageContainer.append(reactionBox);
        messageContainer.addClass("has-reaction");
      }

      $("#chat-container").append(messageContainer);

      if (chat.quote) {
        var quoteBox = $("<div></div>").addClass("quote-box");
        var quoteText = $("<span></span>").addClass("quote-text").text(chat.quote);
        quoteBox.append(quoteText); // const quoteHeight =
        //   messageContainer.find(".quote-box").outerHeight() || 0;
        // const messageHeight = messageDiv.outerHeight() || 0;
        // const totalHeight = nicknameHeight + quoteHeight + messageHeight + 150;

        messageContainer.prepend(quoteBox);
        messageContainer.addClass("has-quote");
        messageContainer.css({
          // height: `${totalHeight}px`,
          position: "relative"
        });
      }

      if (index === chatLog.length - 1) {
        messageContainer.addClass("last-message");

        if (!messageContainer.find(".reaction-box").length) {
          if (messageContainer.width() < 120) {
            $("#chat-container").css("height", "calc(100% - 20px)");
            messageContainer.addClass("no-height-adjust").removeClass("height-adjusted");
            messageContainer.find(".timestamp-label").css("top", "0px");
          } else {
            $("#chat-container").css("height", "100%");
            messageContainer.addClass("height-adjusted").removeClass("no-height-adjust");
            messageContainer.find(".timestamp-label").css("top", "20px");
          }
        } else {
          if (messageContainer.width() < 120) {
            $("#chat-container").css("height", "calc(100% - 20px)");
            messageContainer.addClass("no-height-adjust has-reaction").removeClass("height-adjusted");
            messageContainer.find(".timestamp-label").css("top", "0px");
          } else {
            $("#chat-container").css("height", "100%");
            messageContainer.addClass("height-adjusted has-reaction long-message").removeClass("no-height-adjust");
            messageContainer.find(".timestamp-label").css("top", "20px");
          }
        }
      }

      if (chat.timestamp) {
        appendTimestampLabel(chat.timestamp);
        lastTimestamp = chat.timestamp;
      }

      lastSender = chat.sender;
    });

    if (chatLog.length > 0) {
      var lastChat = chatLog[chatLog.length - 1];

      if (lastChat && lastChat.reaction) {
        $("#chat-container").children().last().css("margin-bottom", "0");
      }
    } // 스크롤할 요소가 지정된 경우 스크롤


    if (scrollToElement) {
      setTimeout(function () {
        scrollToMessage(scrollToElement);
      }, 100);
    }
  }
};