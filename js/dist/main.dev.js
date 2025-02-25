"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

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
  var seenDates = new Set(); // 날짜 중복 방지용 Set

  var outerContainerWidth = $(".outer-container").width();
  var quoteBoxMaxWidth = outerContainerWidth * 0.7;

  function updateCalendarWithEvents() {
    var logsByDate = {}; // 로그들을 날짜별로 그룹화

    $.each(chatLogs, function (key) {
      var date = key.split(", ")[0];

      if (!logsByDate[date]) {
        logsByDate[date] = [];
      }

      logsByDate[date].push(key);
    }); // 각 날짜에 이벤트 추가

    $.each(logsByDate, function (date, logs) {
      var _date$split$map = date.split("-").map(Number),
          _date$split$map2 = _slicedToArray(_date$split$map, 3),
          year = _date$split$map2[0],
          month = _date$split$map2[1],
          day = _date$split$map2[2];

      var monthName = new Date(year, month - 1).toLocaleString("en-US", {
        month: "long"
      }).toLowerCase();
      var calendarBodyId = "#".concat(monthName, "_").concat(year);
      var calendarBody = $(calendarBodyId);

      if (calendarBody.length) {
        var targetDay = calendarBody.find("a[data-date=\"".concat(day, "\"]")).closest("td");

        if (targetDay.length) {
          targetDay.addClass("has-events");
          targetDay.attr("data-logs", JSON.stringify(logs)); // 로그 데이터를 저장
          // 드롭다운 메뉴 추가

          if (logs.length > 1) {
            var dropdownMenu = $("<div></div>").addClass("dropdown-menu");
            logs.forEach(function (logKey) {
              var title = logKey.split(", ")[1];
              var menuItem = $("<div></div>").addClass("dropdown-item").text(title).on("click", function () {
                displayChatLog("", logKey);
                $("#date-selector").val(logKey); // date-selector에 로그 제목과 날짜를 설정

                $("#calendar-container").hide();
                $(".outer-container").css("visibility", "visible");
                dropdownMenu.hide(); // 메뉴 닫기
              });
              dropdownMenu.append(menuItem);
            });
            targetDay.append(dropdownMenu);
            targetDay.on("mouseenter", function () {
              dropdownMenu.css("display", "flex").css("flex-direction", "column");
              targetDay.off("click").on("click", function (event) {
                event.stopPropagation(); // 클릭 이벤트 막음

                event.preventDefault(); // 기본 동작 막음
              });
            });
            targetDay.on("mouseleave", function () {
              dropdownMenu.hide();
            });
          }
        }
      }
    });
  }

  function populateDateSelector() {
    seenDates.clear(); // Set 초기화

    $("#date-selector").empty(); // 기존 옵션 비우기

    Object.keys(chatLogs).forEach(function (logKey) {
      var _logKey$split = logKey.split(", "),
          _logKey$split2 = _slicedToArray(_logKey$split, 2),
          date = _logKey$split2[0],
          title = _logKey$split2[1]; // 날짜와 제목 분리


      var displayText = title ? "".concat(date, " - ").concat(title) : date; // 날짜와 제목이 중복되지 않도록 체크

      if (!seenDates.has(displayText)) {
        seenDates.add(displayText);
        var option = $("<option></option>").attr("value", logKey).text(displayText.trim()); // 날짜와 제목 표시, 불필요한 공백 제거

        $("#date-selector").append(option);
      }
    }); // 디버깅: 추가된 옵션 개수와 내용을 출력
    // console.log(
    //   "Options added to date-selector:",
    //   $("#date-selector option").length
    // );

    $("#date-selector option").each(function (index) {
      console.log("Option ".concat(index + 1, ": ").concat($(this).val(), " - ").concat($(this).text()));
    });
  } // 이벤트 핸들러


  $("#date-selector").change(function () {
    var selectedLogKey = $(this).val();

    if (selectedLogKey) {
      displayChatLog("", selectedLogKey);
      $("#calendar-container").hide();
      $(".outer-container").css("visibility", "visible");
    }
  });
  updateCalendarWithEvents();
  populateDateSelector(); // console.log("populateDateSelector called");

  $(document).on("click", ".ui-datepicker-calendar td.has-events", function () {
    var logs = JSON.parse($(this).attr("data-logs"));

    if (logs && logs.length > 1) {
      showMenuForDate($(this), logs);
    } else if (logs && logs.length === 1) {
      displayChatLog("", logs[0]);
      $("#calendar-container").hide();
      chatContainerWrapper.show();
    }
  });
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
    var lastDivider = $("#chat-container").children(".date-divider").last();

    if (lastDivider.length === 0 || lastDivider.text() !== timestamp) {
      var dateDivider = $("<div></div>").addClass("date-divider").html("<span>".concat(timestamp, "</span>"));

      if ($("#chat-container").children(".date-divider").length === 0) {
        dateDivider.addClass("first");
      }

      $("#chat-container").append(dateDivider);
    }
  }; // 날짜 클릭 시 이벤트 처리


  $(document).on("click", '.ui-datepicker-calendar td[data-handler="selectDay"] a', function (event) {
    var parentTd = $(this).closest("td");

    if (!parentTd.hasClass("has-events")) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    var logs = parentTd.data("logs");
    var year = parentTd.data("year");
    var month = parentTd.data("month") + 1;
    var day = $(this).data("date");
    var formattedDate = "".concat(year, "-").concat(month.toString().padStart(2, "0"), "-").concat(day.toString().padStart(2, "0"));
    console.log("Selected date: ".concat(formattedDate));
    $("#calendar-container").hide();

    if (logs && logs.length > 1) {
      showMenuForDate(parentTd, logs);
    } else {
      displayChatLog("", logs[0]);
    }

    $(".outer-container").css("visibility", "visible");
    $("#search-toggle-button").css("display", "block");
    $("#date-selector").val(formattedDate);
  });

  var italicizeText = function italicizeText(text) {
    return text.replace(/\(([^)]+)\)/g, "<i>($1)</i>");
  };

  var highlightText = function highlightText(text, searchTerm) {
    var regex = new RegExp("(".concat(searchTerm, ")"), "gi");
    return text.replace(regex, '<span class="highlight">$1</span>');
  };

  var isEmojiOnly = function isEmojiOnly(text) {
    var emojiRegex = /^(?:(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u2660\u2663\u2665\u2666\u2668\u267B\u267F\u2692-\u2694\u2696\u2697\u2699\u269B\u269C\u26A0\u26A1\u26A7\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F\uDE80-\uDEF6\uDFE0-\uDFEB\uDFED-\uDFFF]|\uD83E[\uDD00-\uDEFF]|\uD83F[\uDFF0-\uDFFF])|[\u200D\u20E3\uFE0F])+$/;
    return emojiRegex.test(text.trim());
  };

  var getMediaPath = function getMediaPath(fileName) {
    var extensions = ["jpg", "jpeg", "png", "gif", "mp4"];
    var fileExtension = fileName.split(".").pop().toLowerCase();

    if (extensions.includes(fileExtension)) {
      var path = "./src/img/".concat(fileName); // console.log(`File path: ${path}`);

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
    return message;
  };

  var displayChatLog = function displayChatLog() {
    var searchTerm = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    var selectedDate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
    var scrollToElement = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    // 초기 설정
    $("#chat-container").empty();
    $("#no-results").hide();

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
            messageDiv = $("<video controls>").append($("<source>").attr("src", _mediaPath).attr("type", "video/mp4")).addClass("rounded-media").attr("preload", "auto").attr("playsinline", "");
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
          messageDiv.addClass("apple-style");
          processedMessage = processedMessage.replace(/✉️/g, "").replace(/\(([^)]+)\)/g, "<i>($1)</i>").replace(/\\/g, "<br>");
          var messageText = $("<span></span>").html(processedMessage);
          messageDiv.append(messageText);
          messageContainer.append(messageDiv);
          lastSender = chat.sender;

          if (chat.timestamp && chat.timestamp !== lastTimestamp) {
            appendTimestampLabel(chat.timestamp);
            lastTimestamp = chat.timestamp;
          }

          var nextChat = chatLog[index + 1];
          var isLastInGroup = !nextChat || nextChat.sender !== chat.sender;

          if (isLastInGroup) {
            if (senderClass === "me") {
              messageDiv.css("border-radius", "25px 25px 5px 25px");
            } else {
              messageDiv.css("border-radius", "25px 25px 25px 5px");
            }
          } else {
            messageDiv.css("border-radius", "25px");
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
          }); // 애플 메시지 스타일 적용 후 다른 처리를 하지 않도록 종료

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
          messageDiv = $("<video controls>").append($("<source>").attr("src", mediaPath).attr("type", "video/mp4")).addClass("rounded-media").attr("preload", "auto").attr("playsinline", "");
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
            var tooltip = $("#tooltip");
            var top = event.pageY + 10;
            var left = event.pageX + 10;
            var tooltipWidth = tooltip.outerWidth();
            var tooltipHeight = tooltip.outerHeight();

            if (left + tooltipWidth > $(window).width()) {
              left = event.pageX - tooltipWidth - 10;
            }

            if (top + tooltipHeight > $(window).height()) {
              top = event.pageY - tooltipHeight - 10;
            }

            tooltip.html($(this).attr("data-tip"));
            tooltip.css({
              top: "".concat(top, "px"),
              left: "".concat(left, "px")
            });
            tooltip.show();
          }, function () {
            $("#tooltip").hide();
          });
        }

        if (chat.reaction) {
          var _reactionBox = $("<div></div>").addClass("reaction-box");

          var _reactionIcon = $("<span></span>").addClass("reaction-icon").text(chat.reaction);

          _reactionBox.append(_reactionIcon);

          messageContainer.append(_reactionBox);
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

  function showMenuForDate(targetTd, logs) {
    var menu = $("<div></div>").addClass("log-menu");
    logs.forEach(function (logKey) {
      var title = logKey.split(", ")[1];
      var menuItem = $("<div></div>").addClass("log-menu-item").text(title);
      menuItem.on("click", function () {
        displayChatLog("", logKey);
        $("#calendar-container").hide();
        $(".outer-container").show();
        menu.remove(); // 메뉴를 닫음
      });
      menu.append(menuItem);
    });
    targetTd.append(menu);
  }

  var scrollToMessage = function scrollToMessage(messageElement) {
    var container = chatContainer[0];
    var containerHeight = container.clientHeight;
    var messageTop = messageElement.offsetTop;
    var messageHeight = messageElement.clientHeight;
    var scrollPosition = messageTop - containerHeight / 2 + messageHeight / 2;
    container.scrollTo({
      top: scrollPosition,
      behavior: "smooth"
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

  $("#search-input").on("input", function () {
    var searchTerm = $(this).val();
    $("#date-selector").val("");
    displayChatLog(searchTerm);
  });
  $("#search-toggle-button").click(function () {
    $("#search-input").toggle();
  });
  displayChatLog();
});