import React, { useState } from 'react';
import {
  FormField,
  Input,
  Multiselect,
  SpaceBetween,
  Button,
  ExpandableSection
} from '@cloudscape-design/components';

interface DocumentSearchProps {
  onSearch: (filters: {
    q?: string;
    tags?: string[];
    includeDeleted?: boolean;
  }) => void;
}

export const DocumentSearch: React.FC<DocumentSearchProps> = ({ onSearch }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<any[]>([]);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const handleSearch = () => {
    onSearch({
      q: searchText || undefined,
      tags: selectedTags.map(tag => tag.value),
      includeDeleted
    });
  };

  return (
    <ExpandableSection headerText="Search & Filter" variant="container">
      <SpaceBetween direction="vertical" size="m">
        <FormField label="Search documents">
          <Input
            value={searchText}
            onChange={({ detail }) => setSearchText(detail.value)}
            placeholder="Search by name, content, or metadata..."
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </FormField>
        
        <FormField label="Filter by tags">
          <Multiselect
            selectedOptions={selectedTags}
            onChange={({ detail }) => setSelectedTags(detail.selectedOptions)}
            options={[
              { label: 'Important', value: 'important' },
              { label: 'Draft', value: 'draft' },
              { label: 'Final', value: 'final' },
              { label: 'Archive', value: 'archive' }
            ]}
            placeholder="Select tags to filter by"
          />
        </FormField>

        <Button variant="primary" onClick={handleSearch}>
          Apply Filters
        </Button>
      </SpaceBetween>
    </ExpandableSection>
  );
};
