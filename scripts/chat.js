var chatRev =  JSON.parse(localStorage['chatRev2'] || 0);

var messages = [
    'Godnatt :)',
	'Nice!',
	'Spanks :)',
	'Toplists online!',
	'Snyggt!! Jag kommer över om en stund OK?',
	'Yes!',
	'Tja, jag rensade lite och flyttade undan våra experiment filer och bilder. Slängde inget viktigt.',
	'Visstja, Vår site är nästan lika stor som 3st 64kb demos. Det måste vi lösa.'
]

while (chatRev < messages.length) {
    alert(messages[chatRev]);
    chatRev += 1;
}

localStorage['chatRev2'] = JSON.stringify(chatRev);
