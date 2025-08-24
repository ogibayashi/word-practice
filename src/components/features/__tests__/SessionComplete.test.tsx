import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionComplete } from "../SessionComplete";

describe("SessionComplete", () => {
  const mockOnRestart = jest.fn();
  const mockOnHome = jest.fn();

  beforeEach(() => {
    mockOnRestart.mockClear();
    mockOnHome.mockClear();
  });

  it("displays basic completion message and total questions", () => {
    render(<SessionComplete totalQuestions={10} onRestart={mockOnRestart} onHome={mockOnHome} />);

    expect(screen.getByText("学習完了！")).toBeInTheDocument();
    expect(screen.getByText("お疲れさまでした！")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("総問題数")).toBeInTheDocument();
  });

  it("displays correct count and accuracy when provided", () => {
    render(
      <SessionComplete
        totalQuestions={10}
        correctCount={8}
        onRestart={mockOnRestart}
        onHome={mockOnHome}
      />
    );

    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("正解数")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("正解率")).toBeInTheDocument();
  });

  it("handles perfect score correctly", () => {
    render(
      <SessionComplete
        totalQuestions={5}
        correctCount={5}
        onRestart={mockOnRestart}
        onHome={mockOnHome}
      />
    );

    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("does not show stats when correctCount is 0", () => {
    render(
      <SessionComplete
        totalQuestions={10}
        correctCount={0}
        onRestart={mockOnRestart}
        onHome={mockOnHome}
      />
    );

    expect(screen.queryByText("正解数")).not.toBeInTheDocument();
    expect(screen.queryByText("正解率")).not.toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument(); // Total should still show
  });

  it("handles accuracy calculation edge cases", () => {
    // Zero total questions
    render(
      <SessionComplete
        totalQuestions={0}
        correctCount={0}
        onRestart={mockOnRestart}
        onHome={mockOnHome}
      />
    );

    expect(screen.getByText("0")).toBeInTheDocument(); // Should show 0 total
    expect(screen.queryByText("正解数")).not.toBeInTheDocument();
  });

  it("handles invalid input defensively", () => {
    render(
      <SessionComplete
        totalQuestions={-5}
        correctCount={10}
        onRestart={mockOnRestart}
        onHome={mockOnHome}
      />
    );

    // Should handle negative total and excessive correct count
    expect(screen.getByText("0")).toBeInTheDocument(); // Should show 0 for negative total
    expect(screen.queryByText("正解数")).not.toBeInTheDocument(); // No stats shown
  });

  it("clamps correct count to not exceed total", () => {
    render(
      <SessionComplete
        totalQuestions={5}
        correctCount={10}
        onRestart={mockOnRestart}
        onHome={mockOnHome}
      />
    );

    // Check that both total and correct count show 5
    const totalQuestionElements = screen.getAllByText("5");
    expect(totalQuestionElements).toHaveLength(2); // Total and correct count both show 5
    expect(screen.getByText("正解数")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument(); // Should be 100%
  });

  it("calls onRestart when restart button is clicked", async () => {
    const user = userEvent.setup();

    render(<SessionComplete totalQuestions={10} onRestart={mockOnRestart} onHome={mockOnHome} />);

    const restartButton = screen.getByText("もう一度学習する");
    await user.click(restartButton);

    expect(mockOnRestart).toHaveBeenCalledTimes(1);
  });

  it("calls onHome when home button is clicked", async () => {
    const user = userEvent.setup();

    render(<SessionComplete totalQuestions={10} onRestart={mockOnRestart} onHome={mockOnHome} />);

    const homeButton = screen.getByText("ホームに戻る");
    await user.click(homeButton);

    expect(mockOnHome).toHaveBeenCalledTimes(1);
  });

  it("has proper accessibility attributes", () => {
    render(
      <SessionComplete
        totalQuestions={10}
        correctCount={8}
        onRestart={mockOnRestart}
        onHome={mockOnHome}
      />
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-labelledby", "session-complete-title");
    expect(dialog).toHaveAttribute("aria-describedby", "session-complete-description");

    expect(screen.getByLabelText("学習完了！")).toBeInTheDocument();
    expect(screen.getByText("お疲れさまでした！")).toBeInTheDocument();
  });

  it("displays correct button icons and text", () => {
    render(<SessionComplete totalQuestions={10} onRestart={mockOnRestart} onHome={mockOnHome} />);

    const restartButton = screen.getByText("もう一度学習する");
    const homeButton = screen.getByText("ホームに戻る");

    expect(restartButton).toBeInTheDocument();
    expect(homeButton).toBeInTheDocument();

    // Check that buttons have proper styling classes
    expect(restartButton.closest("button")).toHaveClass("w-full");
    expect(homeButton.closest("button")).toHaveClass("w-full");
  });
});
