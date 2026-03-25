import { render, screen, fireEvent } from '@testing-library/react';
import DongFilterBar from './DongFilterBar';

describe('DongFilterBar', () => {
  const mockOnSelectDong = jest.fn();
  const mockOnSortChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    render(
      <DongFilterBar 
        selectedDong={null}
        onSelectDong={mockOnSelectDong}
        totalAptCount={100}
        dongAptCounts={{}}
        dongReportCounts={{}}
        listSort="views"
        onSortChange={mockOnSortChange}
      />
    );
    expect(screen.getByText('전체')).toBeInTheDocument();
    expect(screen.getByText('(100)')).toBeInTheDocument();
  });

  it('calls onSelectDong when a dong button is clicked', () => {
    const { getByText } = render(
      <DongFilterBar 
        selectedDong={null}
        onSelectDong={mockOnSelectDong}
        totalAptCount={10}
        dongAptCounts={{ '청계동': 5 }}
        dongReportCounts={{ '청계동': 2 }}
        listSort="views"
        onSortChange={mockOnSortChange}
      />
    );
    
    // 1. Open dropdown first
    const mainButton = getByText('전체');
    fireEvent.click(mainButton);
    
    // 2. Now select the dong
    const dongButton = getByText('청계동');
    fireEvent.click(dongButton);
    expect(mockOnSelectDong).toHaveBeenCalledWith('청계동');
  });
});
