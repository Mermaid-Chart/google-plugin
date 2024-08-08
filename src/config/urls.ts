export const devUrl = 'https://test.mermaidchart.com';
export const prodUrl = 'https://mermaidchart.com';
export const baseURL = (import.meta as any).env.PROD ? prodUrl : devUrl;
