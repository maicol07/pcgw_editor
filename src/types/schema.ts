export interface FieldDefinition<T = any> {
    /** Internal unique identifier for the field (matches logic model key) */
    key: string;
    /** Display label for the UI */
    label: string;
    /** Optional icon for the field */
    icon?: any;
    /** Optional CSS class for the icon */
    iconClass?: string;
    /** The UI component to render (e.g. 'InputText', 'MultiSelect', 'RatingRow') */
    component: string;
    /** Props to pass to the UI component */
    componentProps?: Record<string, any>;
    /** The parameter name in the Wikitext template (e.g. 'developers', 'release_date') */
    wikitextParam: string;
    /** Default value if not found */
    defaultValue?: T;
    /** Optional specific parser function (for reading wikitext) */
    parser?: (wikitext: string) => any;
    /** Optional specific formatter function (for writing wikitext) */
    formatter?: (value: any) => string;
    /** Optional custom writer function (replacing default behavior) */
    writer?: (wikitext: string, value: any) => string;
    /** Grid column span (default 1) */
    colSpan?: number;
    /** Help text/description displayed below the field */
    /** Help text/description displayed below the field */
    description?: string;
    /** Conditional rendering logic */
    showIf?: (model: any) => boolean;
}

export interface FieldGroup {
    title: string;
    icon?: any;
    iconClass?: string;
    /** Number of grid columns for this group (1-12) */
    gridCols?: number;
    fields: FieldDefinition[];
}

export interface SectionDefinition {
    /** Unique ID for the section */
    id: string;
    /** Section title displayed in the sidebar/tabs */
    title: string;
    /** Optional icon for the section */
    icon?: any;
    /** Optional CSS class for the icon */
    iconClass?: string;
    /** Order index for sorting */
    order: number;
    /** The name of the main template this section maps to (optional, if the whole section is one template) */
    templateName?: string;
    /** List of fields in this section */
    fields?: FieldDefinition[]; // Optional because groups might be used instead
    /** Groups of fields (accordion/sections) */
    groups?: FieldGroup[];
    /** 
     * Optional: If the section doesn't map to a single template but is a collection of things 
     * (like 'Game Data' section with multiple templates), this flag or strategy might be needed.
     */
    isCustomSection?: boolean;
    /** Number of grid columns for the flat fields layout (default 1) */
    gridCols?: number;
}

export type Schema = SectionDefinition[];
