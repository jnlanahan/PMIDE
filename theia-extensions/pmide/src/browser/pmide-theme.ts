/********************************************************************************
 * PMIDE Light — the default visual identity. Light, warm, editorial:
 * paper surfaces, ink text, one copper accent used with restraint.
 * Registered as a VS Code-format theme; stock dark themes stay available
 * for the Code surface.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { MonacoThemingService } from '@theia/monaco/lib/browser/monaco-theming-service';

const PAPER = '#faf6f0';
const PAPER_PANEL = '#f3ede3';
const PAPER_EDITOR = '#fdfbf7';
const PAPER_INSET = '#ece4d8';
const INK = '#2c2825';
const INK_DIM = '#6f675e';
const BORDER = '#e2d9cb';
const COPPER = '#b4551d';
const COPPER_SOFT = '#e8d7c9';

export const PMIDE_LIGHT_THEME_ID = 'pmide-light';

@injectable()
export class PmideThemeContribution implements FrontendApplicationContribution {

    @inject(MonacoThemingService)
    protected readonly theming: MonacoThemingService;

    onStart(): void {
        this.theming.registerParsedTheme({
            id: PMIDE_LIGHT_THEME_ID,
            label: 'PMIDE Light',
            uiTheme: 'vs',
            json: {
                colors: {
                    'focusBorder': COPPER,
                    'foreground': INK,
                    'descriptionForeground': INK_DIM,
                    'selection.background': '#b4551d40',
                    'textLink.foreground': COPPER,
                    'textLink.activeForeground': '#8c3f12',

                    'titleBar.activeBackground': PAPER_PANEL,
                    'titleBar.activeForeground': INK,
                    'menubar.selectionBackground': PAPER_INSET,
                    'menu.background': PAPER_EDITOR,
                    'menu.foreground': INK,

                    'activityBar.background': PAPER_PANEL,
                    'activityBar.foreground': COPPER,
                    'activityBar.inactiveForeground': INK_DIM,
                    'activityBar.border': BORDER,
                    'activityBarBadge.background': COPPER,
                    'activityBarBadge.foreground': '#ffffff',
                    'activityBar.activeBorder': COPPER,

                    'sideBar.background': PAPER,
                    'sideBar.foreground': INK,
                    'sideBar.border': BORDER,
                    'sideBarTitle.foreground': INK_DIM,
                    'sideBarSectionHeader.background': PAPER,
                    'sideBarSectionHeader.foreground': INK_DIM,

                    'editor.background': PAPER_EDITOR,
                    'editor.foreground': INK,
                    'editorLineNumber.foreground': '#b5aa99',
                    'editorLineNumber.activeForeground': COPPER,
                    'editor.lineHighlightBackground': '#f3ede3',
                    'editor.selectionBackground': '#e8d7c9',
                    'editorCursor.foreground': COPPER,
                    'editorWidget.background': PAPER_EDITOR,
                    'editorWidget.border': BORDER,
                    'editorGroupHeader.tabsBackground': PAPER_PANEL,
                    'editorGroup.border': BORDER,

                    'tab.activeBackground': PAPER_EDITOR,
                    'tab.activeForeground': INK,
                    'tab.inactiveBackground': PAPER_PANEL,
                    'tab.inactiveForeground': INK_DIM,
                    'tab.border': BORDER,
                    'tab.activeBorderTop': COPPER,

                    'panel.background': PAPER,
                    'panel.border': BORDER,
                    'panelTitle.activeForeground': INK,
                    'panelTitle.activeBorder': COPPER,

                    'statusBar.background': PAPER_PANEL,
                    'statusBar.foreground': INK_DIM,
                    'statusBar.border': BORDER,
                    'statusBar.noFolderBackground': PAPER_PANEL,

                    'button.background': COPPER,
                    'button.foreground': '#ffffff',
                    'button.hoverBackground': '#8c3f12',
                    'checkbox.background': PAPER_EDITOR,
                    'checkbox.border': BORDER,

                    'input.background': '#ffffff',
                    'input.foreground': INK,
                    'input.border': BORDER,
                    'input.placeholderForeground': '#a89d8c',
                    'inputOption.activeBorder': COPPER,
                    'dropdown.background': '#ffffff',
                    'dropdown.border': BORDER,

                    'list.hoverBackground': PAPER_INSET,
                    'list.activeSelectionBackground': COPPER_SOFT,
                    'list.activeSelectionForeground': INK,
                    'list.inactiveSelectionBackground': '#efe7db',
                    'list.highlightForeground': COPPER,

                    'badge.background': COPPER,
                    'badge.foreground': '#ffffff',
                    'progressBar.background': COPPER,

                    'scrollbarSlider.background': '#d8ccbb88',
                    'scrollbarSlider.hoverBackground': '#c9bba7aa',
                    'scrollbarSlider.activeBackground': '#b4551d66',

                    'notificationCenterHeader.background': PAPER_PANEL,
                    'notifications.background': PAPER_EDITOR,
                    'notifications.border': BORDER,

                    'terminal.background': PAPER_EDITOR,
                    'terminal.foreground': INK,

                    'widget.shadow': '#00000018',
                    'quickInput.background': PAPER_EDITOR,
                    'quickInputList.focusBackground': COPPER_SOFT,
                    'pickerGroup.foreground': COPPER,

                    'gitDecoration.modifiedResourceForeground': '#9c6a1f',
                    'gitDecoration.addedResourceForeground': '#5f7a4e',
                    'gitDecoration.untrackedResourceForeground': '#5f7a4e',
                    'gitDecoration.deletedResourceForeground': '#a04434',
                },
                tokenColors: [
                    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#9a8f80', fontStyle: 'italic' } },
                    { scope: ['string', 'string.quoted'], settings: { foreground: '#5f7a4e' } },
                    { scope: ['constant.numeric', 'constant.language'], settings: { foreground: '#a0522d' } },
                    { scope: ['keyword', 'storage.type', 'storage.modifier'], settings: { foreground: '#8a4b1c' } },
                    { scope: ['entity.name.function', 'support.function'], settings: { foreground: '#4a5568' } },
                    { scope: ['entity.name.type', 'entity.name.class', 'support.type'], settings: { foreground: '#5b4a68' } },
                    { scope: ['variable', 'variable.parameter'], settings: { foreground: '#2c2825' } },
                    { scope: ['markup.heading', 'entity.name.section'], settings: { foreground: '#8a4b1c', fontStyle: 'bold' } },
                    { scope: ['markup.bold'], settings: { fontStyle: 'bold' } },
                    { scope: ['markup.italic'], settings: { fontStyle: 'italic' } },
                ],
            },
        });
    }
}
