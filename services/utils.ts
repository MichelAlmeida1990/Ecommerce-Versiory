export const sanitizeData = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};