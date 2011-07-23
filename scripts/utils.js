function extractArtist(title) {
    var parts = title.split('-');
    if (parts.length > 1) {
        return $.trim(parts[0]);
    }
    return false;
}
