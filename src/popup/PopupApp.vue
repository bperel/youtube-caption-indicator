<template>
  <div>
    <h3>Youtube caption indicator options</h3>
    <p>What languages do you want to see the caption indicators for?</p>
    <form @submit="saveSettings">
      <label v-for="option in optionLabels.hasCustomLanguages" :key="option">
        <input type="radio" v-model="settings.hasCustomLanguages" name="language-option" :value="option.value" />
        {{ option.label }}
      </label>
      <div :class="{ 'language-list': true, disabled: !settings.hasCustomLanguages }">
        <div v-if="!languages">Loading language list...</div>
        <label v-for="language in languages" class="language" :key="language.code">
          <input type="checkbox" :disabled="!settings.hasCustomLanguages" :value="language.code" v-model="settings.customLanguages" />
          <span>{{ language.name }}</span>
        </label>
      </div>

      <input type="submit" value="Validate" />
    </form>
  </div>
</template>

<script>
const axios = require('axios');
import { getCacheValue, setCacheValue } from '../lib/cache';

const apiKey = '__API_KEY__';

export default {
  data() {
    return {
      settings: {},
      optionLabels: {
        hasCustomLanguages: [{ label: 'All languages', value: false }, { label: 'Custom languages', value: true }],
      },
      languages: null,
    };
  },
  methods: {
    saveSettings() {
      if (!this.settings.hasCustomLanguages) {
        this.settings.customLanguages = [];
      }
      setCacheValue('settings', this.settings);
    },
  },
  mounted() {
    let self = this;
    getCacheValue('settings', function(settings) {
      self.settings = settings || {
        hasCustomLanguages: false,
        customLanguages: [],
      };

      axios
        .get(`https://www.googleapis.com/youtube/v3/i18nLanguages?part=snippet&key=${apiKey}`)
        .then(({ data }) => {
          self.languages = data.items
            .map(item => {
              return {
                code: item.snippet.hl,
                name: item.snippet.name,
              };
            })
            .sort(function(a, b) {
              if (a.name < b.name) {
                return -1;
              }
              if (a.name > b.name) {
                return 1;
              }
              return 0;
            });
        })
        .catch(error => console.error(`Error while fetching language list : ${error}`));
    });
  },
};
</script>

<style lang="scss" scoped>
p {
  font-size: 20px;
}
label {
  display: block;
}
.language-list {
  margin: 16px;
}
.language-list.disabled {
  color: grey;
}
</style>
