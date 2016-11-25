import {Events, Styler, UICorePlugin, template} from 'Clappr'
import pluginHtml from './public/level-selector.html'
import pluginStyle from './public/style.scss'

const AUTO = -1;

export default class LevelSelector extends UICorePlugin {

  static get version() { return VERSION; }

  get name() { return 'level_selector'; }
  get template() { return template(pluginHtml); }

  get attributes() {
    return {
      'class': this.name,
      'data-level-selector': ''
    }
  }

  get events() {
    return {
      'click [data-level-selector-select]': 'onLevelSelect',
      'click [data-level-selector-button]': 'onShowLevelSelectMenu'
    }
  }

  bindEvents() {
    this.listenTo(this.core, Events.CORE_READY, this.bindPlaybackEvents);
    this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_CONTAINERCHANGED, this.reload);
    this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_RENDERED, this.render);
  }

  unBindEvents() {
    this.stopListening(this.core, Events.CORE_READY);
    this.stopListening(this.core.mediaControl, Events.MEDIACONTROL_CONTAINERCHANGED);
    this.stopListening(this.core.mediaControl, Events.MEDIACONTROL_RENDERED);
    this.stopListening(this.core.getCurrentPlayback(), Events.PLAYBACK_LEVELS_AVAILABLE);
    this.stopListening(this.core.getCurrentPlayback(), Events.PLAYBACK_LEVEL_SWITCH_START);
    this.stopListening(this.core.getCurrentPlayback(), Events.PLAYBACK_LEVEL_SWITCH_END);
  }

  bindPlaybackEvents() {
      var currentPlayback = this.core.getCurrentPlayback();

      this.listenTo(currentPlayback, Events.PLAYBACK_LEVELS_AVAILABLE, this.fillLevels);
      this.listenTo(currentPlayback, Events.PLAYBACK_LEVEL_SWITCH_START, this.startLevelSwitch);
      this.listenTo(currentPlayback, Events.PLAYBACK_LEVEL_SWITCH_END, this.stopLevelSwitch);
      this.listenTo(currentPlayback, Events.PLAYBACK_BITRATE, this.updateCurrentLevel);

      var playbackLevelsAvaialbeWasTriggered = currentPlayback.levels && currentPlayback.levels.length > 0;
      playbackLevelsAvaialbeWasTriggered && this.fillLevels(currentPlayback.levels);
  }

  reload() {
    this.unBindEvents();
    this.bindEvents();
    this.bindPlaybackEvents();
  }

  shouldRender() {
    if (!this.core.getCurrentContainer()) return false;

    var currentPlayback = this.core.getCurrentPlayback();
    if (!currentPlayback) return false;

    var respondsToCurrentLevel = currentPlayback.currentLevel !== undefined;
    var hasLevels = !!(this.levels && this.levels.length > 0);

    return respondsToCurrentLevel && hasLevels;
  }

  render() {
    if (this.shouldRender()) {
      var style = Styler.getStyleFor(pluginStyle, {baseUrl: this.core.options.baseUrl});

      this.$el.html(this.template({'levels':this.levels, 'title': this.getTitle()}));
      this.$el.append(style);
      this.core.mediaControl.$('.media-control-right-panel').append(this.el);
      this.updateText(this.selectedLevelId);
      this.highlightCurrentLevel();
    }
    return this;
  }

  fillLevels(levels, initialLevel = AUTO) {
    if (this.selectedLevelId === undefined) this.selectedLevelId = initialLevel;
    levels.forEach((level, index) => {
      if (level.level.name) {
        levels[index].label = level.level.name;
      }
    });
    this.levels = levels;
    this.configureLevelsLabels();
    this.render();
  }

  configureLevelsLabels() {
    if (this.core.options.levelSelectorConfig === undefined) return;

    for (var levelName in (this.core.options.levelSelectorConfig.labels || {})) {
      if (!!this.findLevelByName(levelName)) {
        this.changeLevelLabelByName(levelName, this.core.options.levelSelectorConfig.labels[levelName]);
      }
    }
  }

  findLevelBy(id) {
    if (!this.levels) return;
    var foundLevel;
    this.levels.forEach((level) => { if (level.id === id) {foundLevel = level} });
    return foundLevel;
  }

  changeLevelLabelBy(id, newLabel) {
    this.levels.forEach((level, index) => {
      if (level.id === id) {
        this.levels[index].label = newLabel
      }
    })
  }

  findLevelByName(name) {
    if (!this.levels) return;
    var foundLevel;
    this.levels.forEach((level) => { if (level.level.name === name) {foundLevel = level} });
    return foundLevel;
  }

  changeLevelLabelByName(name, newLabel) {
    this.levels.forEach((level, index) => {
      if (level.level.name === name) {
        this.levels[index].label = newLabel;
      }
    })
  }

  onLevelSelect(event) {
    this.selectedLevelId = parseInt(event.target.dataset.levelSelectorSelect, 10);
    this.core.getCurrentPlayback().currentLevel = this.selectedLevelId;

    this.toggleContextMenu();
    this.updateText(this.selectedLevelId);

    event.stopPropagation();
    return false;
  }

  onShowLevelSelectMenu(event) { this.toggleContextMenu(); }

  toggleContextMenu() { this.$('.level_selector ul').toggle(); }

  buttonElement() { return this.$('.level_selector button'); }

  levelElement(id) { return this.$('.level_selector ul a'+(!isNaN(id) ? '[data-level-selector-select="'+id+'"]' : '')).parent(); }

  getTitle() { return (this.core.options.levelSelectorConfig || {}).title; }

  startLevelSwitch() { this.buttonElement().addClass('changing'); }

  stopLevelSwitch() {
    this.buttonElement().removeClass('changing');
    this.updateText(this.selectedLevelId);
  }

  updateText(level) {
    if (level === AUTO) {
      this.buttonElement().text(this.currentLevel ? 'AUTO (' + this.currentLevel.label + ')' : 'AUTO');
    }
    else {
      level = this.findLevelBy(level);
      this.buttonElement().text(level ? level.label : '?');
    }
  }
  updateCurrentLevel(info) {
    var level = this.findLevelBy(info.level);
    this.currentLevel = level ? level : null;
    this.highlightCurrentLevel();
  }
  highlightCurrentLevel() {
    this.levelElement().removeClass('current');
    this.currentLevel && this.levelElement(this.currentLevel.id).addClass('current');
  }
}
