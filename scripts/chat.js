var chatRev =  JSON.parse(localStorage['chatRev2'] || 0);

var messages = [];

while (chatRev < messages.length) {
    alert(messages[chatRev]);
    chatRev += 1;
}

localStorage['chatRev2'] = JSON.stringify(chatRev);
