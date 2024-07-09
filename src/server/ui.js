export const onOpen = () => {
  const menu = DocumentApp.getUi()
    .createMenu('Mermaid Chart') // edit me!
    .addItem('Open Dialog', 'openDialog')
    .addItem('Open Charts', 'openSidebar');

  menu.addToUi();
};

export const openDialog = () => {
  const html = HtmlService.createHtmlOutputFromFile('dialog')
    .setWidth(1366)
    .setHeight(768);
  DocumentApp.getUi().showModalDialog(html, 'Medmaid Chart Dialog');
};

export const openSidebar = () => {
  const html =
    HtmlService.createHtmlOutputFromFile('sidebar').setTitle('Mermaid Chart');
  DocumentApp.getUi().showSidebar(html);
};
