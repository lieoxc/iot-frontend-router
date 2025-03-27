<script setup lang="ts">
import { ref, watch } from 'vue';
import { NButton, NFlex, NForm, NFormItem, NInput, NInputNumber, NModal, NSelect } from 'naive-ui';
import { $t } from '@/locales';
import { commandDataById } from '@/service/api/device';

interface Props {
  visible: boolean;
  value: string;
  placeholder: string;
  selectedOption: {
    key: string;
    [key: string]: any;
  } | null;
  deviceId: string;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'confirm', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  value: '',
  placeholder: '',
  selectedOption: null,
  deviceId: ''
});

const emit = defineEmits<Emits>();

const inputValue = ref(props.value);
const paramsData = ref<any[]>([]);
const isTextArea = ref(false);
const commandOptions = ref<any[]>([]);

// 获取设备支持的命令
const getCommandOptions = async () => {
  if (!props.deviceId) return;
  try {
    const res = await commandDataById(props.deviceId);
    if (res.data) {
      commandOptions.value = res.data;
      // 找到当前选中的命令
      const currentCommand = commandOptions.value.find((cmd: any) => cmd.data_identifier === props.selectedOption?.key);
      if (currentCommand && currentCommand.params) {
        try {
          paramsData.value = JSON.parse(currentCommand.params);
          isTextArea.value = false;
        } catch (e) {
          console.error('解析命令参数失败:', e);
          isTextArea.value = true;
        }
      } else {
        isTextArea.value = true;
      }
    }
  } catch (e) {
    console.error('获取命令列表失败:', e);
    isTextArea.value = true;
  }
};

// 监听选中的选项变化
watch(
  () => props.selectedOption,
  newValue => {
    console.log('selectedOption changed:', newValue);
    if (newValue) {
      getCommandOptions();
    } else {
      isTextArea.value = true;
    }
  },
  { immediate: true }
);

// 监听设备ID变化
watch(
  () => props.deviceId,
  () => {
    if (props.selectedOption) {
      getCommandOptions();
    }
  }
);

const handleConfirm = () => {
  let finalValue = inputValue.value;
  if (!isTextArea.value) {
    const params: any = {};
    paramsData.value.forEach((item: any) => {
      if (item[item.data_identifier] !== undefined) {
        params[item.data_identifier] = item[item.data_identifier];
      }
    });
    finalValue = JSON.stringify(params);
  }
  emit('confirm', finalValue);
  emit('update:visible', false);
};

const handleCancel = () => {
  emit('update:visible', false);
};

const paramsSelect = ref([
  { label: 'true', value: true },
  { label: 'false', value: false }
]);
</script>

<template>
  <NModal
    :show="visible"
    preset="dialog"
    :title="$t('generate.issueCommand')"
    :show-icon="false"
    @update:show="val => emit('update:visible', val)"
  >
    <NForm v-if="!isTextArea">
      <div v-if="paramsData.length > 0" class="title">{{ $t('common.param') }}</div>
      <div v-for="item in paramsData" :key="item.id" class="form_box">
        <div class="form_table">
          <NFormItem :label="item.data_name" label-placement="left" label-width="80px" label-align="left">
            <NInput v-if="item.param_type === 'string'" v-model:value="item[item.data_identifier]" />
            <NInputNumber v-else-if="item.param_type === 'Number'" v-model:value="item[item.data_identifier]" />
            <NSelect
              v-else-if="item.param_type === 'Boolean'"
              v-model:value="item[item.data_identifier]"
              :options="paramsSelect"
            />
            <NSelect
              v-else-if="item.param_type === 'Enum'"
              v-model:value="item[item.data_identifier]"
              :options="
                item.enum_config.map(v => ({
                  ...v,
                  label: v.desc
                }))
              "
              :placeholder="$t('generate.please-select')"
            />
            <div class="description">{{ item.description }}</div>
          </NFormItem>
        </div>
      </div>
    </NForm>
    <NInput v-else v-model:value="inputValue" type="textarea" :placeholder="placeholder" rows="4" />
    <template #action>
      <NFlex justify="end">
        <NButton @click="handleCancel">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="handleConfirm">{{ $t('common.confirm') }}</NButton>
      </NFlex>
    </template>
  </NModal>
</template>

<style lang="scss" scoped>
.form_box {
  width: 100%;
}

.title {
  font-weight: 900;
  font-size: 16px;
  margin-bottom: 10px;
}

.form_table {
  display: flex;

  .n-form-item {
    flex: 1;
    margin-right: 10px;

    :deep(.n-form-item-blank) {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .description {
      margin-top: 10px;
      font-size: 12px;
    }
  }

  .n-input-number {
    width: 100%;
  }
}
</style>
