<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInst, FormItemRule, UploadFileInfo } from 'naive-ui';
// import { genderOptions } from '@/constants'
import { addPackage, editPackage } from '@/service/api/product';
import { createRequiredFormRule } from '@/utils/form/rule';
import { packageOptions } from '@/constants/business';
import { getDemoServerUrl } from '@/utils/common/tool';
import { localStg } from '@/utils/storage';
import { $t } from '@/locales';
const url = ref(new URL(getDemoServerUrl()));

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit';
  /** 编辑的表格行数据 */
  editData?: Api.UpdatePackage.Package | null;
  // 定义设备配置选项
  deviceConfigOptions: Array<{ label: string; value: string }>;
}

const PackageTypeOptions = computed(() => {
  return packageOptions.map(item => {
    const key = item.value === 1 ? 'page.product.update-package.diff' : 'page.product.update-package.full';
    return {
      label: $t(key),
      value: item.value
    };
  });
});

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'TableActionModal' });

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;

  /** 点击协议 */
  (e: 'success'): void;
  (e: 'update:modelValue', val: string): void;
  (e: 'success', file: UploadFileInfo): void;
}

const emit = defineEmits<Emits>();

const modalVisible = computed({
  get() {
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  }
});

const closeModal = () => {
  modalVisible.value = false;
};

const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: $t('common.add'),
    edit: $t('common.edit')
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInst>();

type FormModel = Pick<
  Api.UpdatePackage.Package,
  | 'name'
  | 'version'
  | 'device_config_id'
  | 'module'
  | 'package_type'
  | 'signature_type'
  | 'additional_info'
  | 'description'
  | 'package_url'
  | 'remark'
>;

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  name: createRequiredFormRule($t('common.pleaseCheckValue')),
  version: createRequiredFormRule($t('common.pleaseCheckValue')),
  device_config_id: createRequiredFormRule($t('common.pleaseCheckValue')),
  remark: createRequiredFormRule($t('common.pleaseCheckValue'))
};

function createDefaultFormModel(): FormModel {
  return {
    name: '',
    version: '',
    device_config_id: '',
    module: '', // 暂时不需要模块名称
    package_type: 2, // 默认是整包
    signature_type: 'MD5', // 默认校验方式MD5
    additional_info: '{}', // 暂时不需要额外信息
    description: '',
    package_url: 'www.baidu.com', // 暂时随便填写
    remark: ''
  };
}

function handleUpdateFormModel(model: Partial<FormModel>) {
  Object.assign(formModel, model);
}

function handleUpdateFormModelByModalType() {
  const handlers: Record<ModalType, () => void> = {
    add: () => {
      const defaultFormModel = createDefaultFormModel();
      handleUpdateFormModel(defaultFormModel);
    },
    edit: () => {
      if (props.editData) {
        handleUpdateFormModel(props.editData);
      }
    }
  };

  handlers[props.type]();
}

async function handleSubmit() {
  await formRef.value?.validate();
  let data: any;
  if (props.type === 'add') {
    data = await addPackage(formModel);
  } else if (props.type === 'edit') {
    data = await editPackage(formModel);
  }
  if (!data.error) {
    emit('success');
  }
  closeModal();
}
function handleFinish({ file, event }: { file: UploadFileInfo; event?: ProgressEvent }) {
  const response = JSON.parse((event?.target as XMLHttpRequest).response);
  window.$message?.success(response.message);
  emit('update:modelValue', response.data.path);
  emit('success', file);
  formModel.package_url = response.data.path;
}

function handleError({ event }: { event?: ProgressEvent }) {
  window.$message?.error((event?.target as XMLHttpRequest).response || $t('custom.management.uploadFailed'));
}

function handleRemove() {
  emit('update:modelValue', '');
  return true;
}

watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      handleUpdateFormModelByModalType();
    }
  }
);
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="title" class="w-700px">
    <NForm ref="formRef" label-placement="left" :label-width="124" :model="formModel" :rules="rules">
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem :span="12" :label="$t('page.product.update-package.type')" path="package_type">
          <NSelect
            v-model:value="formModel.package_type"
            clearable
            class="w-200px"
            :options="PackageTypeOptions"
            :disabled="type === 'edit'"
          />
        </NFormItemGridItem>
        <NFormItemGridItem :span="12" :label="$t('page.product.update-package.versionCode')" path="version">
          <NInput v-model:value="formModel.version" :disabled="type === 'edit'" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="12" :label="$t('page.product.update-package.packageName')" path="name">
          <NInput v-model:value="formModel.name" />
        </NFormItemGridItem>
        <!-- 设备配置选择框 -->
        <NFormItemGridItem :span="12" :label="$t('page.product.update-package.deviceConfig')" path="device_config_id">
          <NSelect
            v-model:value="formModel.device_config_id"
            :options="deviceConfigOptions"
            placeholder="请选择设备配置"
            clearable
          />
        </NFormItemGridItem>
        <!--
 <NFormItemGridItem :span="12" :label="$t('page.product.update-package.deviceConfig')" path="device_config_id">
          <NInput v-model:value="formModel.device_config_id" />
        </NFormItemGridItem> 
-->
        <template v-if="type === 'add'">
          <NFormItemGridItem :span="24" :label="$t('page.product.update-package.package')">
            <n-upload
              v-model="formModel.package_url"
              :action="url + '/file/up'"
              :headers="{
                'x-token': localStg.get('token') || ''
              }"
              :data="{
                type: 'upgradePackage'
              }"
              :accept="accept"
              :max="1"
              @finish="handleFinish"
              @remove="handleRemove"
              @error="handleError"
            >
              <n-button>上传文件</n-button>
            </n-upload>
            -->
          </NFormItemGridItem>
        </template>
        <NFormItemGridItem :span="24" :label="$t('common.remark')">
          <NInput v-model:value="formModel.remark" type="textarea" />
        </NFormItemGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="end">
        <NButton class="w-72px" @click="closeModal">{{ $t('common.cancel') }}</NButton>
        <NButton class="w-72px" type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style scoped></style>
