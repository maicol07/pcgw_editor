export interface InputTextProps {
    placeholder?: string;
}

export interface InputChipsProps {
    placeholder?: string;
    allowDuplicate?: boolean;
    separator?: string;
    addOnBlur?: boolean;
}

export interface TextareaProps {
    placeholder?: string;
    rows?: number;
    autoResize?: boolean;
}

export interface CheckboxProps {
    binary?: boolean;
    label?: string;
}

export interface SelectOption {
    label: string;
    value: string;
    description?: string;
    icon?: any;
}

export interface SelectProps {
    placeholder?: string;
    options: SelectOption[];
}

export interface MultiSelectProps {
    placeholder?: string;
    options: (string | SelectOption)[];
}

export interface CompoundRatingFieldProps {
    field: string;
    icon?: any;
    label?: string;
    notesField?: string;
    freeText?: boolean;
    multiple?: boolean;
    options?: (string | SelectOption)[];
}

export interface CoverImageFieldProps {
    placeholder?: string;
}

export interface InfoboxDevelopersEditorProps {
    dataSource: string;
    placeholder?: string;
}

export interface InfoboxPublishersEditorProps {
    dataSource: string;
    placeholder?: string;
}

export interface InfoboxEnginesEditorProps {
    placeholder?: string;
}

export interface TaxonomyFieldProps {
    dataSource: string;
    placeholder?: string;
}

export interface SectionGalleryProps {
    section: string;
}

export interface WikitextEditorProps {
    rows?: number;
}

// Components with no props
type NoProps = Record<string, never>;

export type FieldComponent =
    | { component: 'InputText'; componentProps?: InputTextProps }
    | { component: 'InputChips'; componentProps?: InputChipsProps }
    | { component: 'Textarea'; componentProps?: TextareaProps }
    | { component: 'Checkbox'; componentProps?: CheckboxProps }
    | { component: 'Select'; componentProps: SelectProps }
    | { component: 'MultiSelect'; componentProps: MultiSelectProps }
    | { component: 'CompoundRatingField'; componentProps: CompoundRatingFieldProps }
    | { component: 'CoverImageField'; componentProps: CoverImageFieldProps }
    | { component: 'InfoboxDevelopersEditor'; componentProps: InfoboxDevelopersEditorProps }
    | { component: 'InfoboxPublishersEditor'; componentProps: InfoboxPublishersEditorProps }
    | { component: 'InfoboxEnginesEditor'; componentProps?: InfoboxEnginesEditorProps }
    | { component: 'InfoboxReleaseDates'; componentProps?: NoProps }
    | { component: 'InfoboxReception'; componentProps?: NoProps }
    | { component: 'TaxonomyField'; componentProps: TaxonomyFieldProps }
    | { component: 'SectionGallery'; componentProps: SectionGalleryProps }
    | { component: 'VideoAnalysis'; componentProps?: NoProps }
    | { component: 'StubValidator'; componentProps?: NoProps }
    | { component: 'WikitextEditor'; componentProps?: WikitextEditorProps }
    | { component: 'AvailabilityForm'; componentProps?: NoProps }
    | { component: 'DLCForm'; componentProps?: NoProps }
    | { component: 'GameDataForm'; componentProps?: NoProps }
    | { component: 'SystemRequirementsForm'; componentProps?: NoProps }
    | { component: 'LocalizationsForm'; componentProps?: NoProps }
    | { component: 'OperatingSystemSupportForm'; componentProps?: NoProps };
