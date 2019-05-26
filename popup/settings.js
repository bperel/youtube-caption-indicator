function restoreOptions() {
  var api_key = '__API_KEY__';
  $.getJSON('https://www.googleapis.com/youtube/v3/i18nLanguages?part=snippet&key=' + api_key)
    .done(function (data) {
      var languages = data.items;
      languages.sort(function(a, b) {
        if (a.snippet.hl < b.snippet.h1) {
          return -1;
        }
        if (a.snippet.hl > b.snippet.h1) {
          return 1;
        }
        return 0;
      });
      $.each(languages, function(i, item) {
        var languageRow = $('label.language.template').clone(true).removeClass('template');
        languageRow.find('span').append(item.snippet.hl + ' - ' + item.snippet.name);
        languageRow.find('input').val(item.snippet.hl);
        $('form [type="submit"]').before(languageRow);
      });
    })
    .fail(function (jqxhr, textStatus, error) {
      alert('https://www.googleapis.com/youtube/v3/i18nLanguages?part=snippet&key=' + api_key);
    });
}

function saveOptions() {
  var selectedLanguages = $("input[name='language']:checked").map(function() {
    return $(this).val();
  });
  alert(JSON.stringify(selectedLanguages));
  e.preventDefault();
}


(function () {
  restoreOptions();
  $('form').submit(saveOptions);
}());
