<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NFlex, useDialog, useMessage } from 'naive-ui';
import type { FormInst } from 'naive-ui';
import { deviceGroupTree } from '@/service/api';
import { warningMessageList } from '@/service/api/alarm';
import PopUp from '@/views/alarm/warning-message/components/pop-up.vue';
import {
  deviceConfigAll,
  deviceConfigMetricsMenu,
  deviceListAll,
  deviceMetricsMenu,
  sceneAdd,
  sceneEdit,
  sceneGet,
  sceneInfo
} from '@/service/api/automation';
// import { useRouterPush } from '@/hooks/common/router';
import { $t } from '@/locales';
import { useTabStore } from '@/store/modules/tab';
import ActionValueInput from './components/ActionValueInput.vue';
// eslint-disable-next-line import/no-duplicates
const route = useRoute();
const router = useRouter();
const dialog = useDialog();
// const { routerBack } = useRouterPush();

const configId = ref(route.query.id || '');

// 新建告警弹窗显示状态
const popUpVisible = ref(false);
// 新建告警回执
const newEdit = () => {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  getAlarmList('');
};
// 场景表单实例
const configFormRef = ref<FormInst | null>(null);
// 场景表单数据
const configForm = ref({
  id: '',
  name: '',
  description: '',
  actions: [] as any
});
// 场景表单规则
const configFormRules = ref({
  name: {
    required: true,
    message: $t('generate.enter-scene-name')
  },
  description: {
    required: false,
    message: $t('generate.enterSceneDesc')
  },
  actionType: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  action_type: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  action_target: {
    required: true,
    message: $t('common.select'),
    trigger: 'change',
    validator: (value: any) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return Boolean(value);
    }
  },
  action_param_type: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  action_param: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  actionValue: {
    required: true,
    message: $t('common.select')
  }
});
// 下拉选择器加载状态
const loadingSelect = ref(false);

// 动作选项
const actionOptions = ref([
  {
    label: $t('common.operateDevice'),
    value: '1',
    disabled: false
  }
]);

// 动作选择action值改变时
const actionChange = (actionGroupItem: any, actionGroupIndex: any, data: any) => {
  // eslint-disable-next-line array-callback-return
  actionOptions.value.map(item => {
    item.disabled = false;
  });
  actionGroupItem.actionInstructList = [];
  actionGroupItem.action_type = null;
  actionGroupItem.action_target = null;
  if (data === '1') {
    // eslint-disable-next-line array-callback-return
    actionOptions.value.map(item => {
      if (item.value === '1') {
        item.disabled = true;
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    addIfGroupsSubItem(actionGroupIndex);
  }
};
// 设备类型选项
const actionTypeOptions = ref([
  {
    label: $t('common.multiDevicesInClass'),
    value: '10'
  },
  {
    label: $t('common.singleClassDevice'),
    value: '11'
  }
]);

// 选择设备类型
const actionTypeChange = (instructItem: any, data: any) => {
  instructItem.action_target = [];
  instructItem.action_param_type = null;
  instructItem.action_param = null;
  instructItem.action_param_key = null;
  instructItem.action_value = null;

  if (data === '10') {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getDevice(null, null);
  } else if (data === '11') {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getDeviceConfig('');
  }
};

// 设备分组列表
const deviceGroupOptions = ref([] as any);
// 获取设备分组
const getGroup = async () => {
  deviceGroupOptions.value = [];
  const res = await deviceGroupTree({});
  // eslint-disable-next-line array-callback-return
  res.data.map((item: any) => {
    deviceGroupOptions.value.push(item.group);
  });
};

// 设备列表
const deviceOptions = ref([] as any);
const queryDevice = ref({
  group_id: null,
  device_name: null,
  bind_config: 0
});

// 获取设备列表
const getDevice = async (groupId: any, name: any) => {
  queryDevice.value.group_id = groupId || null;
  queryDevice.value.device_name = name || null;
  const res = await deviceListAll(queryDevice.value);
  // 过滤掉气象站模板设备
  deviceOptions.value = res.data.filter((device: any) => device.device_config_name !== '气象站模板');
};

const queryDeviceName = ref([] as any);
const handleFocus = (ifIndex: any) => {
  queryDeviceName.value[ifIndex].focus();
};

// 设备配置列表
const deviceConfigOption = ref([]);
// 设备配置列表查询条件
const queryDeviceConfig = ref({
  device_config_name: ''
});
// 获取设备配置列表
const getDeviceConfig = async (name: any) => {
  queryDeviceConfig.value.device_config_name = name || '';
  const res = await deviceConfigAll(queryDeviceConfig.value);
  deviceConfigOption.value = res.data || [];
};

// 选择动作目标
const actionTargetChange = (instructItem: any) => {
  instructItem.action_param_type = null;
  instructItem.action_param = null;
  instructItem.actionValue = null;
  instructItem.actionParamOptionsData = [];
  instructItem.actionParamTypeOptions = [];
  instructItem.actionParamOptions = [];
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  actionParamShow(instructItem);
};

// 下拉获取的动作标识符
const actionParamShow = async (instructItem: any) => {
  let res = null as any;
  if (instructItem.action_type === '10') {
    // 获取第一个设备的度量菜单作为参考
    const firstDeviceId = Array.isArray(instructItem.action_target)
      ? instructItem.action_target[0]
      : instructItem.action_target;
    res = await deviceMetricsMenu({ device_id: firstDeviceId });
  } else if (instructItem.action_type === '11') {
    res = await deviceConfigMetricsMenu({
      device_config_id: instructItem.action_target
    });
  }
  // eslint-disable-next-line array-callback-return
  if (res.data) {
    // eslint-disable-next-line array-callback-return
    res.data.map((item: any) => {
      item.value = item.data_source_type;
      item.label = `${item.data_source_type}${item.label ? `(${item.label})` : ''}`;

      // eslint-disable-next-line array-callback-return
      item.options.map((subItem: any) => {
        subItem.value = subItem.key;
        subItem.label = `${subItem.label ? `${subItem.label}` : ''}`;
      });
    });
    // eslint-disable-next-line require-atomic-updates
    instructItem.actionParamOptionsData = res.data;
    // eslint-disable-next-line require-atomic-updates
    instructItem.actionParamTypeOptions = res.data.map((item: any) => {
      return {
        label: item.label,
        value: item.value
      };
    });
    if (instructItem.action_param_type) {
      instructItem.actionParamOptions =
        instructItem.actionParamOptionsData.find(item => item.data_source_type === instructItem.action_param_type)
          ?.options || [];
      if (
        instructItem.action_param_type === 'c_attribute' ||
        instructItem.action_param_type === 'c_telemetry' ||
        instructItem.action_param_type === 'c_command'
      ) {
        instructItem.showSubSelect = false;
      } else {
        instructItem.showSubSelect = true;
      }
    }
    if (instructItem.action_param && instructItem.actionParamOptions.length > 0) {
      instructItem.actionParamData =
        instructItem.actionParamOptions.find(item => item.key === instructItem.action_param) || null;
      if (instructItem.actionParamData.data_type) {
        instructItem.actionParamData.data_type = instructItem.actionParamData.data_type.toLowerCase();
      }
    }
  }
};
const placeholderMap = {
  telemetry: '20',
  attributes: 'on-line',
  command: '{"param1":1}',
  c_telemetry: '{"switch":1,"switch1":0}',
  c_attribute: '{"addr":1,"port":0}',
  c_command: '{"method":"switch1","params":{"false":0}}'
};
// 选择设备属性类型
const actionParamTypeChange = (instructItem: any, data: any) => {
  instructItem.action_param = null;
  instructItem.actionParamData = null;
  instructItem.actionParamOptions =
    instructItem.actionParamOptionsData.find(item => item.data_source_type === data)?.options || [];
  instructItem.placeholder = placeholderMap[data];
  instructItem.actionValue = null;
  if (
    instructItem.action_param_type === 'c_attribute' ||
    instructItem.action_param_type === 'c_telemetry' ||
    instructItem.action_param_type === 'c_command'
  ) {
    instructItem.showSubSelect = false;
  } else {
    instructItem.showSubSelect = true;
  }
};
// 选择动作标识符
const actionParamChange = (instructItem: any, data: any) => {
  instructItem.actionValue = null;
  instructItem.actionParamData = instructItem.actionParamOptions.find(item => item.key === data) || null;
  if (instructItem.actionParamData.data_type) {
    instructItem.actionParamData.data_type = instructItem.actionParamData.data_type.toLowerCase();
  }
};
const message = useMessage();
// 动作值标识
const actionValueChange = (instructItem: any) => {
  if (
    instructItem.action_param_type === 'command' ||
    instructItem.action_param_type === 'c_attribute' ||
    instructItem.action_param_type === 'c_telemetry' ||
    instructItem.action_param_type === 'c_command'
  ) {
    try {
      JSON.parse(instructItem.actionValue);
      if (typeof JSON.parse(instructItem.actionValue) === 'object') {
        instructItem.inputFeedback = '';
        instructItem.inputValidationStatus = undefined;
      } else {
        message.error($t('common.enterJson'));
        instructItem.inputValidationStatus = 'error';
      }
    } catch (e) {
      message.error($t('common.enterJson'));
      // instructItem.inputFeedback=$t('common.enterJson')
      instructItem.inputValidationStatus = 'error';
    }
  }
};

// 场景列表
const sceneList = ref([]);
// 场景查询条件
const queryScene = ref({
  page: 1,
  page_size: 10,
  name: ''
});
// 获取场景列表
const getSceneList = async (name: string) => {
  queryScene.value.name = name || '';
  loadingSelect.value = true;
  const res = await sceneGet(queryScene.value);
  sceneList.value = res.data.list;
  loadingSelect.value = false;
};

// 告警列表
const alarmList = ref([]);
// 告警列表查询条件
const queryAlarm = ref({
  page: 1,
  page_size: 10,
  name: ''
});
const getAlarmList = async (name: string) => {
  queryAlarm.value.name = name || '';
  loadingSelect.value = true;
  const res = await warningMessageList(queryAlarm.value);
  loadingSelect.value = false;
  alarmList.value = res.data.list;
};

// 操作设备类型的数据Item
const instructListItem = ref({
  action_target: [], // 修改为数组，支持多选 动作目标id  设备id、设备配置id，场景id、告警id
  action_type: null, // 动作标识符类型
  action_param_type: null, // 动作标识符类型
  action_param: null, // 动作标识符类型
  action_param_key: null,
  action_value: null, // 参数值
  deviceGroupId: null, // 设备分组ID
  actionParamOptions: [], // 动作标识属性下拉列表数据选项
  actionParamOptionsData: [], // 动作标识菜单下拉列表数据选项
  actionParamTypeOptions: [] // 动作标识类型下拉列表
});

// 动作数组的item
const actionItem = ref({
  actionType: null,
  action_type: null, // 动作类型后端
  action_target: null, // 动作目标id   设备id、设备配置id，场景id、告警id
  actionInstructList: []
});

// 新增一个动作组
const addActionGroupItem = async () => {
  if (configForm.value.actions.length !== 0) {
    await configFormRef.value?.validate();
  }
  const actionItemData = JSON.parse(JSON.stringify(actionItem.value));
  // actionItemData.actionInstructList.push(JSON.parse(JSON.stringify(instructListItem.value)));
  configForm.value.actions.push(actionItemData);
};
// 删除一个动作组
const deleteActionGroupItem = (actionGroupIndex: any) => {
  configForm.value.actions.splice(actionGroupIndex, 1);
};

// 给某个动作组中增加指令
const addIfGroupsSubItem = async (actionGroupIndex: any) => {
  configForm.value.actions[actionGroupIndex].actionInstructList.push(
    JSON.parse(JSON.stringify(instructListItem.value))
  );
};
// 删除某个动作组中的某个指令
const deleteIfGroupsSubItem = (actionGroupIndex: any, ifIndex: any) => {
  configForm.value.actions[actionGroupIndex].actionInstructList.splice(ifIndex, 1);
};

const tabStore = useTabStore();
// 表单提交
const submitData = async () => {
  await configFormRef.value?.validate();
  const actionsData = [] as any;
  configForm.value.actions.map((item: any) => {
    if (item.actionType === '1') {
      item.actionInstructList.map((instructItem: any) => {
        // 处理多个设备
        if (Array.isArray(instructItem.action_target)) {
          instructItem.action_target.forEach(deviceId => {
            const newAction = { ...instructItem, action_target: deviceId };
            // 处理不同类型的action_value
            if (instructItem.action_param_type === 'telemetry' || instructItem.action_param_type === 'attributes') {
              const action_value = {};
              action_value[instructItem.action_param] = instructItem.actionValue;
              newAction.action_value = JSON.stringify(action_value);
            } else if (instructItem.action_param_type === 'command') {
              const action_value = {
                method: instructItem.action_param,
                params: JSON.parse(instructItem.actionValue)
              };
              newAction.action_value = JSON.stringify(action_value);
            } else if (
              instructItem.action_param_type === 'c_telemetry' ||
              instructItem.action_param_type === 'c_attribute' ||
              instructItem.action_param_type === 'c_command'
            ) {
              newAction.action_value = instructItem.actionValue;
            }
            actionsData.push(newAction);
          });
        }
      });
    } else {
      item.action_type = item.actionType;
      actionsData.push(item);
    }
  });
  dialog.warning({
    title: $t('common.tip'),
    content: $t('common.saveSceneInfo'),
    positiveText: $t('device_template.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      // configForm.value.actions = actionsData;
      const configFormData = JSON.parse(JSON.stringify(configForm.value));
      configFormData.actions = actionsData;
      if (configId.value) {
        const res = await sceneEdit(configFormData);
        if (!res.error) {
          await tabStore.removeTab(route.path);
          router.replace({ path: '/automation/scene-manage' });
        }
      } else {
        const res = await sceneAdd(configFormData);
        if (!res.error) {
          await tabStore.removeTab(route.path);
          router.replace({ path: '/automation/scene-manage' });
        }
      }
    }
  });
};

const getSceneInfo = async () => {
  const res = await sceneInfo(configId.value);
  configForm.value = { ...configForm.value, ...res.data.info };
  configForm.value.actions = res.data.actions;
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  dataEcho(configForm.value.actions);
};

const dataEcho = actionsData => {
  const actionGroupsData = [] as any;
  const actionInstructList = [] as any;

  // 使用一个Map来合并相同动作配置的设备
  const actionMap = new Map();
  actionsData.map((item: any) => {
    // 一个或者多个设备
    if (item.action_type === '10') {
      item.actionParamOptions = [];
      const actionValueObj = JSON.parse(item.action_value);
      if (item.action_param_type === 'command') {
        item.actionValue = JSON.stringify(actionValueObj.params);
      }
      const key = `${item.action_param_type}-${item.action_param}-${item.action_value}`;
      if (!actionMap.has(key)) {
        actionMap.set(key, { ...item, action_target: [item.action_target] });
        item.action_target = [item.action_target];
        actionParamShow(item);
        actionInstructList.push(item);
      } else {
        // 找到 actionInstructList 中对应的 item 并更新其 action_target
        const existingItem = actionInstructList.find(
          listItem =>
            listItem.action_param_type === item.action_param_type &&
            listItem.action_param === item.action_param &&
            listItem.action_value === item.action_value
        );
        if (existingItem) {
          existingItem.action_target.push(item.action_target);
        }
      }
    } else if (item.action_type === '11') {
      // 单个类型
      item.actionParamOptions = [];
      const actionValueObj = JSON.parse(item.action_value);
      if (
        item.action_param_type === 'c_telemetry' ||
        item.action_param_type === 'c_attribute' ||
        item.action_param_type === 'c_command'
      ) {
        item.actionValue = item.action_value;
      }
      // 如果是telemetry/attribute，那么 action_value示例格式：{"humidity":2}
      if (item.action_param_type === 'telemetry' || item.action_param_type === 'attributes') {
        // item.action_value = JSON.stringify(action_value);
        item.actionValue = actionValueObj[item.action_param];
      }
      // 如果是command/c_command，那么 action_value示例格式:	{"method":"ReSet","params":{"switch":1,"light":"close"}}
      if (item.action_param_type === 'command') {
        item.actionValue = actionValueObj.params;
      }
      item.actionParamOptions = [];
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      actionParamShow(item);
      actionInstructList.push(item);
    } else {
      item.actionType = item.action_type;
      actionGroupsData.push(item);
    }
  });

  if (actionInstructList.length > 0) {
    const type1Data = {
      actionType: '1',
      actionInstructList
    };
    actionGroupsData.push(type1Data);
  }
  configForm.value.actions = actionGroupsData;
};

// 在 setup 中添加新的响应式变量
const showActionValueInput = ref(false);
const currentInstructItem = ref(null);

interface ActionParamChangeParams {
  instructItem: any;
  data: any;
  actionGroupIndex: number;
  instructIndex: number;
}

const handleActionParamChange = ({ instructItem, data, actionGroupIndex, instructIndex }: ActionParamChangeParams) => {
  actionParamChange(instructItem, data);
  console.log('instructItem:', instructItem);
  console.log('actionParamOptions:', instructItem.actionParamOptions);
  // 找到当前选中的选项
  const selectedOption = instructItem.actionParamOptions.find((option: any) => option.key === data);
  console.log('selectedOption:', selectedOption);

  // 获取第一个设备ID
  const deviceId = Array.isArray(instructItem.action_target)
    ? instructItem.action_target[0]
    : instructItem.action_target;

  currentInstructItem.value = {
    ...instructItem,
    selectedOption: selectedOption || null,
    actionGroupIndex,
    instructIndex,
    deviceId
  };
  showActionValueInput.value = true;
};

const handleActionValueConfirm = (value: string) => {
  if (currentInstructItem.value) {
    // 找到对应的 instructItem 并更新
    const { actionGroupIndex, instructIndex } = currentInstructItem.value;
    const instructItem = configForm.value.actions[actionGroupIndex].actionInstructList[instructIndex];
    instructItem.actionValue = value;
    actionValueChange(instructItem);
  }
};

onMounted(() => {
  getGroup();
  getDevice(null, null);
  getAlarmList('');
  getSceneList('');
  getDeviceConfig('');
  if (configId.value) {
    // eslint-disable-next-line no-unused-expressions
    typeof configId.value === 'string' ? (configForm.value.id = configId.value) : '';
    getSceneInfo();
  } else {
    addActionGroupItem();
  }
});
</script>

<template>
  <div class="scene-edit">
    <NCard :bordered="false" :title="`${configId ? $t('card.editScene') : $t('card.addScene')}`">
      <NForm
        ref="configFormRef"
        :model="configForm"
        :rules="configFormRules"
        label-placement="left"
        label-width="100"
        size="small"
      >
        <NFormItem :label="$t('generate.labelName')" path="name" class="w-150">
          <NInput v-model:value="configForm.name" :placeholder="$t('generate.enterSceneName')" />
        </NFormItem>
        <NFormItem :label="$t('generate.description')" path="description" class="w-150">
          <NInput
            v-model:value="configForm.description"
            type="textarea"
            :placeholder="$t('generate.enter-description')"
            rows="1"
          />
        </NFormItem>
        <NFormItem :label="$t('generate.action')" required class="w-100%" :show-feedback="false">
          <NFlex vertical class="mt-1 w-100%">
            <NFlex
              v-for="(actionGroupItem, actionGroupIndex) in configForm.actions"
              :key="actionGroupIndex"
              class="mt-1 w-100%"
            >
              <NFormItem
                :show-label="false"
                :show-feedback="false"
                :path="`actions[${actionGroupIndex}].actionType`"
                :rule="configFormRules.actionType"
                class="max-w-30 w-full"
              >
                <NSelect
                  v-model:value="actionGroupItem.actionType"
                  :options="actionOptions"
                  @update:value="data => actionChange(actionGroupItem, actionGroupIndex, data)"
                />
              </NFormItem>
              <template v-if="actionGroupItem.actionType === '1'">
                <!-- 执行动作是操作设备->添加指令 -->
                <NCard class="flex-1">
                  <NFlex
                    v-for="(instructItem, instructIndex) in actionGroupItem.actionInstructList"
                    :key="instructIndex"
                    class="mb-2 mr-30"
                  >
                    <NFormItem
                      :show-label="false"
                      :show-feedback="false"
                      :path="`actions[${actionGroupIndex}].actionInstructList[${instructIndex}].action_type`"
                      :rule="configFormRules.action_type"
                      class="max-w-30 w-full"
                    >
                      <NSelect
                        v-model:value="instructItem.action_type"
                        :options="actionTypeOptions"
                        @update:value="data => actionTypeChange(instructItem, data)"
                      />
                    </NFormItem>
                    <template v-if="instructItem.action_type === '10'">
                      <NFormItem
                        :show-label="false"
                        :show-feedback="false"
                        :path="`actions[${actionGroupIndex}].actionInstructList[${instructIndex}].action_target`"
                        :rule="configFormRules.action_target"
                        class="max-w-50 w-full"
                      >
                        <NSelect
                          v-model:value="instructItem.action_target"
                          :options="deviceOptions"
                          value-field="id"
                          label-field="name"
                          :consistent-menu-width="false"
                          :loading="loadingSelect"
                          multiple
                          @update:value="() => actionTargetChange(instructItem)"
                        >
                          <template #header>
                            <NFlex align="center" class="w-500px">
                              {{ $t('generate.group') }}
                              <n-select
                                v-model:value="queryDevice.group_id"
                                :options="deviceGroupOptions"
                                label-field="name"
                                value-field="id"
                                class="max-w-40"
                                clearable
                                @update:value="data => getDevice(data, queryDevice.device_name)"
                              />
                              <NInput
                                ref="queryDeviceName"
                                v-model:value="queryDevice.device_name"
                                class="flex-1"
                                clearable
                                autofocus
                                @click="handleFocus(instructIndex)"
                              ></NInput>
                              <NButton
                                type="primary"
                                @click.stop="getDevice(queryDevice.group_id, queryDevice.device_name)"
                              >
                                {{ $t('common.search') }}
                              </NButton>
                            </NFlex>
                          </template>
                        </NSelect>
                      </NFormItem>
                    </template>
                    <template v-if="instructItem.action_type === '11'">
                      <NFormItem
                        :show-label="false"
                        :show-feedback="false"
                        :path="`actions[${actionGroupIndex}].actionInstructList[${instructIndex}].action_target`"
                        :rule="configFormRules.action_target"
                        class="max-w-40 w-full"
                      >
                        <NSelect
                          v-model:value="instructItem.action_target"
                          :options="deviceConfigOption"
                          label-field="name"
                          value-field="id"
                          :placeholder="$t('common.select')"
                          remote
                          filterable
                          @search="getDeviceConfig"
                          @update:value="() => actionTargetChange(instructItem)"
                        />
                      </NFormItem>
                    </template>
                    <template v-if="instructItem.action_type">
                      <NFormItem
                        :show-label="false"
                        :show-feedback="false"
                        :path="`actions[${actionGroupIndex}].actionInstructList[${instructIndex}].action_param_type`"
                        :rule="configFormRules.action_param_type"
                        class="max-w-50 w-full"
                      >
                        <NSelect
                          v-model:value="instructItem.action_param_type"
                          :options="instructItem.actionParamTypeOptions"
                          class="max-w-50"
                          @update:value="data => actionParamTypeChange(instructItem, data)"
                        />
                      </NFormItem>
                      <NFormItem
                        v-if="instructItem.showSubSelect"
                        :show-label="false"
                        :show-feedback="false"
                        :path="`actions[${actionGroupIndex}].actionInstructList[${instructIndex}].action_param`"
                        :rule="configFormRules.action_param"
                        class="max-w-40 w-full"
                      >
                        <NSelect
                          v-model:value="instructItem.action_param"
                          :options="instructItem.actionParamOptions"
                          @update:value="
                            data => handleActionParamChange({ instructItem, data, actionGroupIndex, instructIndex })
                          "
                        />
                      </NFormItem>
                      <NFormItem
                        v-if="instructItem.showSubSelect && instructItem.actionParamData"
                        :show-label="false"
                        :show-feedback="false"
                        :path="`actions[${actionGroupIndex}].actionInstructList[${instructIndex}].actionValue`"
                        :rule="configFormRules.actionValue"
                        :validation-status="instructItem.inputValidationStatus"
                        :feedback="instructItem.inputFeedback"
                        class="max-w-60 w-full"
                      >
                        <NInput
                          v-if="instructItem.actionParamData.data_type === 'string'"
                          v-model:value="instructItem.actionValue"
                          :placeholder="$t('common.as') + '：' + instructItem.placeholder"
                          class="w-full"
                          @blur="actionValueChange(instructItem)"
                        />
                        <n-input-number
                          v-if="instructItem.actionParamData.data_type === 'number'"
                          v-model:value="instructItem.actionValue"
                          class="w-full"
                          :placeholder="$t('common.as') + '：' + instructItem.placeholder"
                          :show-button="false"
                        />
                        <n-radio-group
                          v-if="instructItem.actionParamData.data_type === 'boolean'"
                          v-model:value="instructItem.actionValue"
                          name="radiogroup"
                        >
                          <n-space>
                            <n-radio :value="true">true</n-radio>
                            <n-radio :value="false">false</n-radio>
                          </n-space>
                        </n-radio-group>
                      </NFormItem>
                      <NFormItem
                        v-if="!instructItem.showSubSelect"
                        :show-label="false"
                        :show-feedback="false"
                        :path="`actions[${actionGroupIndex}].actionInstructList[${instructIndex}].actionValue`"
                        :rule="configFormRules.actionValue"
                        :validation-status="instructItem.inputValidationStatus"
                        :feedback="instructItem.inputFeedback"
                        class="w-60"
                      >
                        <NInput
                          v-model:value="instructItem.actionValue"
                          :placeholder="$t('common.as') + '：' + instructItem.placeholder"
                          class="w-full"
                          @blur="actionValueChange(instructItem)"
                        />
                      </NFormItem>
                    </template>
                    <NButton
                      v-if="instructIndex === 0"
                      type="primary"
                      class="absolute right-5"
                      @click="addIfGroupsSubItem(actionGroupIndex)"
                    >
                      {{ $t('generate.add-row') }}
                    </NButton>
                    <NButton
                      v-if="instructIndex !== 0"
                      type="error"
                      class="absolute right-5"
                      @click="deleteIfGroupsSubItem(actionGroupIndex, instructIndex)"
                    >
                      {{ $t('common.delete') }}
                    </NButton>
                  </NFlex>
                </NCard>
              </template>
              <template v-if="actionGroupItem.actionType === '20'">
                <NFlex class="ml-6 w-auto" align="center">
                  <NFormItem
                    :label="$t('generate.activate')"
                    label-width="60px"
                    :show-feedback="false"
                    :path="`actions[${actionGroupIndex}].action_target`"
                    :rule="configFormRules.action_target"
                    class="w-full"
                  >
                    <NSelect
                      v-model:value="actionGroupItem.action_target"
                      :options="sceneList"
                      label-field="name"
                      value-field="id"
                      :placeholder="$t('common.select')"
                      :loading="loadingSelect"
                      filterable
                      class="max-w-50"
                      remote
                      @search="getSceneList"
                    />
                  </NFormItem>
                </NFlex>
              </template>
              <template v-if="actionGroupItem.actionType === '30'">
                <NFlex class="ml-6 w-auto">
                  <NFormItem
                    :label="$t('generate.trigger')"
                    label-width="60px"
                    :show-feedback="false"
                    :path="`actions[${actionGroupIndex}].action_target`"
                    :rule="configFormRules.action_target"
                  >
                    <NSelect
                      v-model:value="actionGroupItem.action_target"
                      :options="alarmList"
                      label-field="name"
                      value-field="id"
                      :placeholder="$t('common.select')"
                      class="max-w-50"
                      filterable
                      remote
                      :loading="loadingSelect"
                      @search="getAlarmList"
                    />
                  </NFormItem>
                  <NButton class="w-20" dashed type="info" @click="popUpVisible = true">
                    {{ $t('generate.create-alarm') }}
                  </NButton>
                </NFlex>
              </template>
              <NButton v-if="actionGroupIndex > 0" type="error" @click="deleteActionGroupItem(actionGroupIndex)">
                {{ $t('generate.delete-execution-action') }}
              </NButton>
            </NFlex>
            <NButton type="primary" class="w-30" @click="addActionGroupItem()">
              {{ $t('generate.add-execution-action') }}
            </NButton>
          </NFlex>
        </NFormItem>
      </NForm>
      <n-divider class="divider-class" />
      <NFlex justify="center" class="mb-5">
        <NButton type="primary" @click="submitData">{{ $t('generate.save-scene-configuration') }}</NButton>
      </NFlex>
    </NCard>
    <PopUp v-model:visible="popUpVisible" type="add" @new-edit="newEdit" />
    <ActionValueInput
      v-model:visible="showActionValueInput"
      :value="currentInstructItem?.actionValue"
      :placeholder="currentInstructItem?.placeholder"
      :selected-option="currentInstructItem?.selectedOption"
      :device-id="currentInstructItem?.deviceId"
      @confirm="handleActionValueConfirm"
    />
  </div>
</template>

<style scoped>
:deep(.n-card__content) {
  padding: 10px 10px 4px 10px !important;
}
</style>
