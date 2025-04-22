# Heading Decorator

## Introduction

This is a plugin for [Obsidian](https://obsidian.md).

Implement displaying specific content around headings based on their levels.

This plugin supports optional decoration for reading view, editing view (*Live Preview* and *Source mode*), *[Outline](https://help.obsidian.md/plugins/outline)* and *[Headings in Explorer](https://github.com/patrickchiang/obsidian-headings-in-explorer)* plugin. This plugin does not modify any note content, only decorates the heading section based on the existing note content.

## Preview

In *Live Preview*:

![Preview](images/preview.jpg)

The interaction between the decorator and the collapse button:

![Collapse Button Interaction](images/collapse-button-interaction.gif)

## Settings

### Metadata keyword

The key name that reads the enabled status from the [properties](https://help.obsidian.md/Editing+and+formatting/Properties). The default value is: `heading`. Usage reference: [Enabled status of notes](#enabled-status-of-notes).

### Enabled

The plugin supports configure heading decorator for each editor mode. You can control the effect range:

- **Enabled in reading view**: Allow to decorate the heading under the *Reading* view.
- **Enabled in live preview**: Allow to decorate the heading under the *Live Preview*.
- **Enabled in source mode**: Allow to decorate the heading under the *Source mode*.
- **Enabled in outline plugin**: Allow to decorate the heading under the *Outline* plugin.
- **Enabled in "Headings in Explorer" plugin**: Allow to decorate the heading under the *[Headings in Explorer](https://github.com/patrickchiang/obsidian-headings-in-explorer)* plugin.

In addition, you can enable the default status of each note within the *Manage* subpage. It mainly works together with [Enabled status of notes](#enabled-status-of-notes).

### Effect

Control the display effect of the decorator.

- **Ordered**: Toggle this setting to enable the decoration of headings as an [ordered](#ordered) or [unordered](#unordered) list.
- **Opacity**: Set the opacity of the heading decorator. The value is the form of percentage.
- **Position**: Set the position of the heading decorator. You can configure the content to appear before or after the heading.

Here are some examples of the differences between different positions:

| Before the heading | Before the heading (inside) | After the heading |
| :----------------: | :-------------------------: | :---------------: |
| ![before](images/before.jpg) | ![before-inside](images/before-inside.jpg) | ![after](images/after.jpg) |

### Ordered

Similar to the effect displayed in the [Preview](#preview).

You can control the counter style type and delimiter. There are two special types of counter styles:

- **Custom list styles**: Set custom list styles for ordered list. Using spaces to separate entries.
- **Specified string**: Set a specified string for ordered list.

For example:

| Decimal numbers | Custom List Styles (using `Ⓐ Ⓑ Ⓒ`) | Specified String (using `#` with empty delimiter) |
| :-------------: | :----------------------------------: | :-----------------------------------------------: |
| ![Decimal numbers](images/decimal.jpg) | ![Custom list styles](images/custom-list-styles.jpg) | ![Specified string](images/specified-string.jpg) |

#### Allow zero level

For the *Allow zero level* setting, if the next heading is more than one level higher, the omitted level is zero instead of one. For example:

| Default | Allow zero level |
| :-----: | :--------------: |
| ![Default](images/omitted.jpg) | ![Allow zero level](images/zero.jpg) |

#### Based on the existing highest level

For the *Based on the existing highest level* setting, use the highest level of headings in the note as the base for ordered list. For example:

| Default | Based on the existing highest level |
| :-----: | :----------------------------------: |
| ![Default](images/heading-2.jpg) | ![Based on the existing highest level](images/based-on-existing.jpg) |

#### Ignore the single heading at the top-level

For the *Ignore the single heading at the top-level* setting, if the top-level has only a single heading, exclude it when building an ordered list. This setting contains *Based on the existing highest level*, but it deals with more "aggressive". For example:

| Default | Ignore the single heading at the top-level |
| :-----: | :----------------------------------------: |
| ![Default](images/default.jpg) | ![Ignore the single heading at the top-level](images/ignore-single-heading.jpg) |

##### The maximum number of ignored

For enabled: Ignore the single heading at the top-level. The maximum number of ignored headings at the top-level. For example:

| Default | Ignore the single heading at the top-level with default value (`6`) | The maximum number of ignored is `1` |
| :-----: | :-----------------------------------------------------------------: | :----------------------------------: |
| ![Default](images/no-ignore.jpg) | ![Ignore the single heading at the top-level](images/ignore-default.jpg) | ![The maximum number of ignored is 1](images/ignore-with-number-1.jpg) |

### Unordered

Directly decorate the heading according to the level. For example:

| Ordered (Decimal numbers) | Unordered (using `H1 H2 H3 H4 H5 H6`) |
| :-----: | :--------------: |
| ![Ordered](images/ordered.jpg) | ![Unordered](images/unordered.jpg) |

### Blacklist

#### Folder blacklist

Disables the heading decorator in notes within the specified folder. For notes that are on the blacklist, you can still use [Enabled status of notes](#enabled-status-of-notes).

#### Note name regex blocklist

Disables the heading decorator in notes whose note name matches the specified regular expression. The format uses [JavaScript regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions), for example: `/^daily.*/i`. For notes that are on the blacklist, you can still use [Enabled status of notes](#enabled-status-of-notes).

## Enabled status of notes

This plugin allows for configure the enabled status based on specific fields in the note [properties](https://help.obsidian.md/Editing+and+formatting/Properties). You can individually control the enabled status of a note.

You can specify the status after the configured property [keyword](#metadata-keyword):

```yaml
---
heading: false
---
```

The values `true`, `yes`, `on` or `1` indicates enabled; the values `false`, `no`, `off` or `0` indicates disabled. Other values are equivalent to undeclared.

You can also use the following subfields to specify the status of a specific mode:

- **reading**: the status of the decorator in the reading view.
- **preview**: the status of the decorator in the live preview.
- **source**: the status of the decorator in the source mode.
- **outline**: the status of the decorator in the outline plugin.
- **file-explorer**: the status of the decorator in the "Headings in Explorer" plugin.
- **all**: the status of the decorator in all modes.

For example, you can set all other modes to be disabled and enable the decorator in the reading view alone:

```yaml
---
heading:
  all: false
  reading: true
---
```

If you prefer to use Obsidian's default property `cssclasses`, you can also fill in `cssclasses` with some equivalent class names:

- reading: `enable-reading-heading`/`disable-reading-heading`
- preview: `enable-preview-heading`/`disable-preview-heading`
- source: `enable-source-heading`/`disable-source-heading`
- outline: `enable-outline-heading`/`disable-outline-heading`
- file-explorer: `enable-file-explorer-heading`/`disable-file-explorer-heading`
- all: `enable-heading`/`disable-heading`

Like:

```yaml
---
cssclasses: disable-heading
---
```

## Custom decorator styles

You can customize the heading decorator style by CSS classes. For decorators in the editor, `.custom-heading-decorator` can be used. Or for specific editor modes:

- Reading view: `.reading-custom-heading-decorator`.
- Live Preview: `.preview-custom-heading-decorator`.
- Source mode: `.source-custom-heading-decorator`.

For decorators in other plugins, it is necessary to combine pseudo-element keywords:

- Outline: `.outline-custom-heading-decorator::before` or `.outline-custom-heading-decorator::after`.
- Headings in Explorer: `.file-explorer-custom-heading-decorator::before` or `.file-explorer-custom-heading-decorator::after`.

For example, make all the decorators display in green:

```css
.custom-heading-decorator,
.outline-custom-heading-decorator::before,
.outline-custom-heading-decorator::after,
.file-explorer-custom-heading-decorator::before,
.file-explorer-custom-heading-decorator::after {
  color: green;
}
```

## Credits

- [@jsamr/counter-style](https://github.com/jsamr/react-native-li/tree/master/packages/counter-style#readme)

## License

[MIT](/LICENSE) license
