import { FieldDefinition } from '../types/schema';
import {
    InputTextProps,
    InputChipsProps,
    TextareaProps,
    CheckboxProps,
    SelectProps,
    MultiSelectProps,
    CompoundRatingFieldProps,
    CoverImageFieldProps,
    InfoboxDevelopersEditorProps,
    InfoboxPublishersEditorProps,
    InfoboxEnginesEditorProps,
    TaxonomyFieldProps,
    SectionGalleryProps,
    WikitextEditorProps,
    FieldComponent
} from '../types/components';

type OmitComponent<T> = Omit<T, 'component' | 'componentProps'>;

export const text = (label: string, props?: InputTextProps, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'InputText',
    componentProps: props,
    ...options
});

export const chips = (label: string, props?: InputChipsProps, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'InputChips',
    componentProps: props,
    ...options
});

export const textarea = (label: string, props?: TextareaProps, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'Textarea',
    componentProps: props,
    ...options
});

export const checkbox = (label: string, props?: CheckboxProps, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'Checkbox',
    componentProps: props,
    ...options
});

export const select = (label: string, props: SelectProps, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'Select',
    componentProps: props,
    ...options
});

export const multiselect = (label: string, props: MultiSelectProps, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'MultiSelect',
    componentProps: props,
    ...options
});

export const rating = (label: string, props: CompoundRatingFieldProps, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'CompoundRatingField',
    componentProps: props,
    ...options
});

export const cover = (label: string, props?: CoverImageFieldProps, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'CoverImageField',
    componentProps: props || {},
    ...options
});

export const developers = (label: string, props: InfoboxDevelopersEditorProps, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'InfoboxDevelopersEditor',
    componentProps: props,
    ...options
});

export const publishers = (label: string, props: InfoboxPublishersEditorProps, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'InfoboxPublishersEditor',
    componentProps: props,
    ...options
});

export const engines = (label: string, props?: InfoboxEnginesEditorProps, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'InfoboxEnginesEditor',
    componentProps: props || {},
    ...options
});

export const releaseDates = (label: string, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'InfoboxReleaseDates',
    ...options
});

export const reception = (label: string, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'InfoboxReception',
    ...options
});

export const taxonomy = (label: string, props: TaxonomyFieldProps, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'TaxonomyField',
    componentProps: props,
    ...options
});

export const gallery = (label: string, props: SectionGalleryProps, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'SectionGallery',
    componentProps: props,
    ...options
});

export const videoAnalysis = (label: string, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'VideoAnalysis',
    ...options
});

export const stubValidator = (options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    component: 'StubValidator',
    ...options,
    label: options?.label || ''
});

export const wikitext = (label: string, props?: WikitextEditorProps, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'WikitextEditor',
    componentProps: props,
    ...options
});

export const custom = (label: string, component: string, props?: any, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: component as any,
    componentProps: props || {},
    ...options
} as FieldComponent & OmitComponent<Partial<FieldDefinition>>);

// Forms
export const availability = (label: string, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'AvailabilityForm',
    ...options
});

export const dlc = (label: string, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'DLCForm',
    ...options
});

export const gameData = (label: string, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'GameDataForm',
    ...options
});

export const systemRequirements = (label: string, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'SystemRequirementsForm',
    ...options
});

export const localizations = (label: string, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'LocalizationsForm',
    ...options
});

export const osSupport = (label: string, options?: OmitComponent<Partial<FieldDefinition>>): FieldComponent & OmitComponent<Partial<FieldDefinition>> => ({
    label,
    component: 'OperatingSystemSupportForm',
    ...options
});
