chrome.app.runtime.onLaunched.addListener(function() {
    window.API_HOST = "{{ API_HOST }}";
    chrome.app.window.create('index.html', {
        'width': 1000,
        'height': 650
    });
});
