import React, { useState } from 'react';
import {
  View,
  TextField,
  SelectField,
  CheckboxField,
  Button,
  Flex,
  Divider
} from '@aws-amplify/ui-react';
import { ExpandableSection } from '@cloudscape-design/components';

interface AmplifyDocumentSearchProps {
  onSearch: (filters: any) => void;
}

export const AmplifyDocumentSearch: React.FC<AmplifyDocumentSearchProps> = ({ onSearch }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [dateRange, setDateRange] = useState('all');

  const handleSearch = () => {
    onSearch({
      q: searchText || undefined,
      tags: selectedTags,
      includeDeleted,
      dateRange: dateRange !== 'all' ? dateRange : undefined
    });
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedTags([]);
    setIncludeDeleted(false);
    setDateRange('all');
    onSearch({});
  };

  return (
    <View>
      <ExpandableSection headerText="Advanced Search & Filters">
        <Flex direction="column" gap="medium">
          <TextField
            label="Search Documents"
            descriptiveText="Search by name, content, or metadata"
            placeholder="Enter search terms..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />

          <SelectField
            label="Filter by Tags"
            descriptiveText="Select tags to filter documents"
            value={selectedTags[0] || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value && !selectedTags.includes(value)) {
                setSelectedTags([...selectedTags, value]);
              }
            }}
          >
            <option value="">Select a tag...</option>
            <option value="important">Important</option>
            <option value="draft">Draft</option>
            <option value="final">Final</option>
            <option value="archive">Archive</option>
            <option value="project">Project</option>
            <option value="meeting">Meeting</option>
          </SelectField>

          {selectedTags.length > 0 && (
            <View>
              <Flex direction="row" gap="small" wrap="wrap">
                {selectedTags.map(tag => (
                  <Button
                    key={tag}
                    variation="link"
                    size="small"
                    onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                  >
                    {tag} ✕
                  </Button>
                ))}
              </Flex>
            </View>
          )}

          <SelectField
            label="Date Range"
            descriptiveText="Filter by modification date"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="year">This year</option>
          </SelectField>

          <CheckboxField
            label="Include deleted documents"
            name="includeDeleted"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
          />

          <Divider />

          <Flex direction="row" justifyContent="flex-end" gap="small">
            <Button
              variation="link"
              onClick={handleReset}
            >
              Reset Filters
            </Button>
            <Button
              variation="primary"
              onClick={handleSearch}
            >
              Apply Filters
            </Button>
          </Flex>
        </Flex>
      </ExpandableSection>
    </View>
  );
};
