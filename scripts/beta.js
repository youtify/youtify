$(document).ready(function() {
	if ('beta_theme' in localStorage) {
		$('#themes-cloud').show();
	} else {
		$('#themes-cloud').hide();
	}
});
