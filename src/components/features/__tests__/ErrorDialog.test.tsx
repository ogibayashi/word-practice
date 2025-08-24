import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorDialog } from "../ErrorDialog";

describe("ErrorDialog", () => {
  const mockOnClose = jest.fn();
  const mockOnAction = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnAction.mockClear();
  });

  it("displays error title and message", () => {
    render(<ErrorDialog title="エラー" message="テストエラーメッセージ" onClose={mockOnClose} />);

    expect(screen.getByText("エラー")).toBeInTheDocument();
    expect(screen.getByText("テストエラーメッセージ")).toBeInTheDocument();
  });

  it("shows only close button when no action provided", () => {
    render(<ErrorDialog title="エラー" message="テストメッセージ" onClose={mockOnClose} />);

    expect(screen.getByText("閉じる")).toBeInTheDocument();
    expect(screen.queryByText("再試行")).not.toBeInTheDocument();
  });

  it("shows both action and close buttons when action provided", () => {
    render(
      <ErrorDialog
        title="エラー"
        message="テストメッセージ"
        onClose={mockOnClose}
        actionLabel="再試行"
        onAction={mockOnAction}
      />
    );

    expect(screen.getByText("再試行")).toBeInTheDocument();
    expect(screen.getByText("閉じる")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();

    render(<ErrorDialog title="エラー" message="テストメッセージ" onClose={mockOnClose} />);

    const closeButton = screen.getByText("閉じる");
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onAction when action button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <ErrorDialog
        title="エラー"
        message="テストメッセージ"
        onClose={mockOnClose}
        actionLabel="再試行"
        onAction={mockOnAction}
      />
    );

    const actionButton = screen.getByText("再試行");
    await user.click(actionButton);

    expect(mockOnAction).toHaveBeenCalledTimes(1);
  });

  it("has proper accessibility attributes", () => {
    render(<ErrorDialog title="エラー発生" message="接続に失敗しました" onClose={mockOnClose} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-labelledby", "error-dialog-title");
    expect(dialog).toHaveAttribute("aria-describedby", "error-dialog-description");

    expect(screen.getByLabelText("エラー発生")).toBeInTheDocument();
    expect(screen.getByText("接続に失敗しました")).toBeInTheDocument();
  });

  it("applies correct button variants based on action presence", () => {
    const { rerender } = render(
      <ErrorDialog title="エラー" message="テストメッセージ" onClose={mockOnClose} />
    );

    // Without action, close button should have default variant
    let closeButton = screen.getByText("閉じる").closest("button");
    expect(closeButton).not.toHaveClass("border"); // Not outline variant

    rerender(
      <ErrorDialog
        title="エラー"
        message="テストメッセージ"
        onClose={mockOnClose}
        actionLabel="再試行"
        onAction={mockOnAction}
      />
    );

    // With action, close button should have outline variant
    closeButton = screen.getByText("閉じる").closest("button");
    const actionButton = screen.getByText("再試行").closest("button");

    expect(actionButton).toHaveClass("flex-1");
    expect(closeButton).toHaveClass("flex-1");
  });
});
