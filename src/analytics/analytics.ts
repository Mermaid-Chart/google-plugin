import httpClient from './httpClient';
class Analytics {

  public sendEvent(eventName: string, eventID:string, errorMessage?: string, diagramType?:string, userLoginState: boolean = true) {
    const analyticsID = getAnalyticsID();
    const pluginID= "google-docs-plugin";
    const pluginSource = 'googledocs';
    const payload = {
      analyticsID,
      pluginID,
      eventName,
      eventID,
      userLoginState,
      pluginSource,
      errorMessage,
      diagramType
    };

    httpClient.post('/rest-api/plugins/pulse', payload).catch(error => {
      if (error.code !== 'ERR_NETWORK') {
        console.error('Failed to send analytics event:', error);
      }
    });
  }


  public trackLogin() {
    this.sendEvent('Google Docs Plugin Logged In','GOOGLE_DOCS_PLUGIN_LOGIN');
  }

  public trackLogout() {
    this.sendEvent('Google Docs Logged Out','GOOGLE_DOCS_PLUGIN_LOGOUT', undefined, undefined, false);
  }

  public trackBrowseDiagram() {
    this.sendEvent('Google Docs Browse Diagram','GOOGLE_DOCS_PLUGIN_BROWSE_DIAGRAM');
  }
  
  public trackNewDiagram() {
    this.sendEvent('Google Docs New Diagram', 'GOOGLE_DOCS_PLUGIN_NEW_DIAGRAM');
  }

  public trackEditDiagram() {
    this.sendEvent('Google Docs Edit Diagram', 'GOOGLE_DOCS_PLUGIN_EDIT_DIAGRAM');
  }

  public trackUpdateAllDiagrams() {
    this.sendEvent('Google Docs Update All Diagrams', 'GOOGLE_DOCS_PLUGIN_UPDATE_ALL_DIAGRAMS');
  }
}

function getAnalyticsID() {
  const STORAGE_KEY = 'MERMAIDCHART_ANALYTICS_ID';

  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export default new Analytics(); 