# Heading Decorator

[English](./README.md) | **简体中文** | [繁體中文](./README-zh_TW.md)

## 介绍

这是一个用于 [Obsidian](https://obsidian.md) 的插件，实现根据标题的级别在标题周围显示特定内容。

此插件可选地支持为阅读视图、编辑视图（*实时阅览*和*源码模式*）、*[大纲](https://help.obsidian.md/plugins/outline)*、*[Quiet Outline](https://github.com/guopenghui/obsidian-quiet-outline)* 和 *[Headings in Explorer](https://github.com/patrickchiang/obsidian-headings-in-explorer)* 插件提供装饰。这个插件不修改任何笔记内容，只根据现有的笔记内容装饰标题部分。

## 预览

在*实时阅览*中：

![实时阅览](images/preview.jpg)

装饰器与折叠按钮之间的交互：

![折叠按钮之间的交互](images/collapse-button-interaction.gif)

## 设置

### 元数据关键词

从[属性（元数据）](https://help.obsidian.md/Editing+and+formatting/Properties)读取启用状态的键名。默认值为：`heading`。使用参考：[笔记的启用状态](#笔记的启用状态)。

### 启用

插件支持为每个编辑模式配置标题装饰器。您可以控制效果范围：

- **在阅读视图中启用**：允许在*阅读视图*下装饰标题。
- **在实时阅览中启用**：允许在*实时阅览*下装饰标题。
- **在源码模式中启用**：允许在*源码模式*下装饰标题。
- **在大纲插件中启用**：允许在*大纲*插件下装饰标题。
- **在 Quiet Outline 插件中启用**：允许装饰 *[Quiet Outline](https://github.com/guopenghui/obsidian-quiet-outline)* 插件下的标题。
- **在 Headings in Explorer 插件中启用**：允许装饰 *[Headings in Explorer](https://github.com/patrickchiang/obsidian-headings-in-explorer)* 插件下的标题。

此外，您还可以通过*配置*子页面启用每个笔记的默认状态，它主要与[笔记的启用状态](#笔记的启用状态)协同工作。

### 效果

控制装饰器的显示效果。

- **有序列表**：切换此设置可将标题装饰为[有序](#有序列表)或[无序](#无序列表)列表。
- **不透明度**：设置标题装饰器的不透明度。值是百分比的形式。
- **位置**：设置标题装饰器的位置。您可以将内容配置为显示在标题之前或之后。
- **所识别的最大级别**：指定所识别标题的最大级别，不处理高于此级别的标题。

以下是一些不同位置之间的差异示例：

| 在标题之前 | 在标题之前 (内部) | 在标题之后 |
| :------: | :------------: | :------: |
| ![在标题之前](images/before.jpg) | ![在标题之前 (内部)](images/before-inside.jpg) | ![在标题之后](images/after.jpg) |

以下是不同的所识别最大级别示例：

| 所识别的最大级别为 `6` | 所识别的最大级别为 `4` |
| :----------------: | :-----------------: |
| ![max-6](images/max-6.jpg) | ![max4](images/max-4.jpg) |

### 有序列表

类似于[预览](#预览)中展示的效果。

您可以控制计数器的样式类型和分隔符。存在两种特殊的计数器样式：

- **自定义列表样式**：为有序列表设置自定义列表样式。使用空格分隔条目。
- **指定字符串**：为有序列表设置指定的字符串。

示例：

| 十进制数字 | 自定义列表样式 (使用 `Ⓐ Ⓑ Ⓒ`) | 指定字符串 (使用 `#` 以及空分隔符) |
| :------: | :-------------------------: | :---------------------------: |
| ![十进制数字](images/decimal.jpg) | ![自定义列表样式](images/custom-list-styles.jpg) | ![指定字符串](images/specified-string.jpg) |

#### 允许零级别

对于*允许零级别*设置，如果下一个标题高出一个以上的级别，则省略的级别为零而不是一。例如：

| 默认 | 允许零级别 |
| :--: | :-----: |
| ![默认](images/omitted.jpg) | ![允许零级别](images/zero.jpg) |

#### 基于现有的最高级别

对于*基于现有的最高级别*设置，将使用笔记中最高级别的标题作为有序列表的基础。例如：

| 默认 | 基于现有的最高级别 |
| :--: | :------------: |
| ![默认](images/heading-2.jpg) | ![基于现有的最高级别](images/based-on-existing.jpg) |

#### 始终忽略顶层的标题

在构建有序列表时将顶层的标题排除掉，受*忽略的最大层级数量*选项控制。例如：

| 默认 | 始终忽略顶层的标题 (忽略的最大层级数量为 `2`) |
| :--: | :----------------------------------:|
| ![默认](images/default.jpg) | ![始终忽略顶层的标题](images/always.jpg) |

#### 忽略顶层的独立标题

对于*忽略顶层的独立标题*设置，如果顶层只有一个标题，则在构建有序列表时将其排除，受*忽略的最大层级数量*选项控制。此设置包含*基于现有的最高级别*，但它处理得更为“激进”。例如：

| 默认 | 启用 (忽略的最大层级数量为 `1`) | 启用 (忽略的最大层级数量为 `6`) |
| :--: | :-----------------------: | :------------------------: |
| ![默认](images/no-ignore.jpg) | ![忽略顶层的独立标题 1](images/ignore-with-number-1.jpg) | ![忽略顶层的独立标题 6](images/ignore-with-number-6.jpg) |

### 无序列表

直接根据级别装饰标题。例如：

| 有序列表 (十进制数字) | 无序列表 (使用 `H1 H2 H3 H4 H5 H6`) |
| :---------------: | :-------------------------------: |
| ![有序列表](images/ordered.jpg) | ![无序列表](images/unordered.jpg) |

### 源码模式的其他设置

#### 隐藏非活动行上的井字符

隐藏非活动行上的井字符(`#`)，类似于实时阅览。

### 阻止列表

#### 文件夹阻止列表

禁用指定文件夹内笔记中的标题装饰器。对于处于阻止列表中的笔记，您仍然可以使用[笔记的启用状态](#笔记的启用状态)。

#### 笔记名称正则表达式阻止列表

禁用笔记名称与指定正则表达式匹配的笔记中的标题装饰器。格式使用 [JavaScript 正则表达式](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions)，例如：`/^daily.*/i`。对于处于阻止列表中的笔记，您仍然可以使用[笔记的启用状态](#笔记的启用状态)。

## 笔记的启用状态

此插件允许根据笔记[属性](https://help.obsidian.md/Editing+and+formatting/Properties)中的特定字段配置启用状态。您可以单独控制笔记的启用状态。

您可以在配置的属性[关键词](#元数据关键词)后指定状态，例如：

```yaml
---
heading: false
---
```

值 `true`、`yes`、`on` 或 `1` 表示启用；值 `false`、`no`、`off` 或 `0` 表示禁用。其他值等同于未声明。

您还可以使用以下子字段指定特定模式的状态：

- **reading**: 装饰器在阅读视图中的状态。
- **preview**: 装饰器在实时阅览中的状态。
- **source**: 装饰器在源码模式下的状态。
- **outline**: 装饰器在大纲插件中的状态。
- **quiet-outline**: 装饰器在 Quiet Outline 插件中的状态。
- **file-explorer**: 装饰器在 Headings in Explorer 插件中的状态。
- **all**: 装饰器在所有模式下的状态。

例如，您可以将所有其他模式设置为禁用状态，并仅在阅读视图中单独启用装饰器：

```yaml
---
heading:
  all: false
  reading: true
---
```

如果您更喜欢使用 Obsidian 的默认属性 `cssclasses`，您也可以在 `cssclasses` 中填写一些等价的类名：

- reading: `enable-reading-heading`/`disable-reading-heading`
- preview: `enable-preview-heading`/`disable-preview-heading`
- source: `enable-source-heading`/`disable-source-heading`
- outline: `enable-outline-heading`/`disable-outline-heading`
- quiet-outline: `enable-quiet-outline-heading`/`disable-quiet-outline-heading`
- file-explorer: `enable-file-explorer-heading`/`disable-file-explorer-heading`
- all: `enable-heading`/`disable-heading`

例如，一个与上述示例相等的值：

```yaml
---
cssclasses:
  - disable-heading
  - enable-reading-heading
---
```

## 自定义装饰器样式

您可以通过 CSS 类自定义标题装饰器样式。对于编辑器中的装饰器，可以使用 `.custom-heading-decorator`。或者针对特定的编辑器模式：

- 阅读视图：`.reading-custom-heading-decorator`
- 实时阅览：`.preview-custom-heading-decorator`
- 源码模式：`.source-custom-heading-decorator`

对于其他插件中的装饰器，需要组合伪元素关键词：

- 大纲: `.outline-custom-heading-decorator::before` 或 `.outline-custom-heading-decorator::after`
- Quiet Outline: `.quiet-outline-custom-heading-decorator::before` 或 `.quiet-outline-custom-heading-decorator::after`
- Headings in Explorer: `.file-explorer-custom-heading-decorator::before` 或 `.file-explorer-custom-heading-decorator::after`

例如，使所有装饰器显示为绿色：

```css
.custom-heading-decorator,
.outline-custom-heading-decorator::before,
.outline-custom-heading-decorator::after,
.quiet-outline-custom-heading-decorator::before,
.quiet-outline-custom-heading-decorator::after,
.file-explorer-custom-heading-decorator::before,
.file-explorer-custom-heading-decorator::after {
  color: green;
}
```

此外，此插件还提供了一组 CSS 变量，用于自定义装饰器的间距：

- `--reading-heading-decorator-margin`: 阅读视图中标题装饰器的间距。
- `--reading-heading-decorator-translate`: 阅读视图中标题装饰器的动画平移距离。
- `--preview-heading-decorator-margin`: 实时阅览中标题装饰器的间距。
- `--preview-heading-decorator-translate`: 实时阅览中标题装饰器的动画平移距离。
- `--source-heading-decorator-margin`: 源码模式中标题装饰器的间距。
- `--source-heading-decorator-translate`: 源码模式中标题装饰器的动画平移距离。
- `--outline-heading-decorator-margin`: 大纲插件中标题装饰器的间距。
- `--quiet-outline-heading-decorator-margin`: Quiet Outline 插件中标题装饰器的间距。
- `--file-explorer-heading-decorator-margin`: Headings in Explorer 插件中标题装饰器的间距。

例如，将阅读视图中标题装饰器的间距调整为 `8px`：

```css
body {
  --reading-heading-decorator-margin: 8px;
}
```

## 致谢

- [@jsamr/counter-style](https://github.com/jsamr/react-native-li/tree/master/packages/counter-style#readme)

## 许可

[MIT](/LICENSE)
