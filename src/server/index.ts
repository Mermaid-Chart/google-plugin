import {
  onOpen,
  openDialog,
  openEditDialog,
  openSidebar,
  getOAuthURL,
  handleCallback,
  getAuthorizationState,
  resetOAuth,
  insertBase64ImageWithMetadata,
  replaceSelectedImageWithBase64AndSize,
  readSelectedImageMetadata,
} from './ui';

import { getSheetsData, addSheet, deleteSheet, setActiveSheet } from './sheets';

// Public functions must be exported as named exports
export {
  onOpen,
  openDialog,
  openEditDialog,
  openSidebar,
  getSheetsData,
  addSheet,
  deleteSheet,
  setActiveSheet,
  getOAuthURL,
  handleCallback,
  getAuthorizationState,
  resetOAuth,
  insertBase64ImageWithMetadata,
  replaceSelectedImageWithBase64AndSize,
  readSelectedImageMetadata,
};
