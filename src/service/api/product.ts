import { request } from '../request';

/** 获取升级包列表 */
export const fetchPackageList = async (params: any) => {
  const data = await request.get<Api.UpdatePackage.Data | null>('/ota/package', {
    params
  });
  return data;
};

export const delPackage = async (id: string) => {
  const data = await request.delete<Api.UpdatePackage.Data>(`/ota/package/${id}`);
  return data;
};

/** 添加升级包 */
export const addPackage = async (params: any) => {
  const data = await request.post<Api.UpdatePackage.Data>('/ota/package', params);
  return data;
};

/** 编辑升级包 */
export const editPackage = async (params: any) => {
  const data = await request.put<Api.UpdatePackage.Data>('/ota/package', params);
  return data;
};

/** 获取升级任务列表 */
export const fetchUpgradeTaskList = async (params: any) => {
  const data = await request.get<Api.UpgradeTask.Data | null>('/ota/task', {
    params
  });
  return data;
};

export const addUpgradeTask = async (params: any) => {
  const data = await request.post<Api.UpgradeTask.Data>('/ota/task', params);
  return data;
};

export const fetchUpgradeTaskDetail = async (params: any) => {
  const data = await request.get<Api.UpgradeDetail.Data | null>('/ota/task/detail', {
    params
  });
  return data;
};
