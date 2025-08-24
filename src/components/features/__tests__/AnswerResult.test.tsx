import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnswerResult } from "../AnswerResult";

describe("AnswerResult", () => {
  const mockOnNext = jest.fn();

  beforeEach(() => {
    mockOnNext.mockClear();
  });

  it("displays correct feedback for right answers", () => {
    render(
      <AnswerResult
        isCorrect={true}
        userAnswer="apple"
        correctAnswers={["apple", "fruit"]}
        japaneseMeaning="りんご"
        onNext={mockOnNext}
      />
    );

    expect(screen.getByText("正解！")).toBeInTheDocument();
    expect(screen.getByText("apple")).toBeInTheDocument();
    expect(screen.getByText("りんご")).toBeInTheDocument();
  });

  it("displays incorrect feedback for wrong answers", () => {
    render(
      <AnswerResult
        isCorrect={false}
        userAnswer="banana"
        correctAnswers={["apple", "fruit"]}
        japaneseMeaning="りんご"
        onNext={mockOnNext}
      />
    );

    expect(screen.getByText("不正解")).toBeInTheDocument();
    expect(screen.getByText("banana")).toBeInTheDocument();
    expect(screen.getByText("apple, fruit")).toBeInTheDocument();
    expect(screen.getByText("正解")).toBeInTheDocument();
  });

  it("shows multiple correct answers when available", () => {
    render(
      <AnswerResult
        isCorrect={true}
        userAnswer="apple"
        correctAnswers={["apple", "fruit", "red fruit"]}
        japaneseMeaning="りんご"
        onNext={mockOnNext}
      />
    );

    expect(screen.getByText("他の正解")).toBeInTheDocument();
    expect(screen.getByText("fruit, red fruit")).toBeInTheDocument();
  });

  it("does not show other answers section if only one correct answer", () => {
    render(
      <AnswerResult
        isCorrect={true}
        userAnswer="apple"
        correctAnswers={["apple"]}
        japaneseMeaning="りんご"
        onNext={mockOnNext}
      />
    );

    expect(screen.queryByText("他の正解")).not.toBeInTheDocument();
  });

  it("changes button text for last question", () => {
    render(
      <AnswerResult
        isCorrect={true}
        userAnswer="apple"
        correctAnswers={["apple"]}
        japaneseMeaning="りんご"
        onNext={mockOnNext}
        isLastQuestion={true}
      />
    );

    expect(screen.getByText("結果を見る")).toBeInTheDocument();
    expect(screen.queryByText("次の問題")).not.toBeInTheDocument();
  });

  it("shows next question button for non-last questions", () => {
    render(
      <AnswerResult
        isCorrect={true}
        userAnswer="apple"
        correctAnswers={["apple"]}
        japaneseMeaning="りんご"
        onNext={mockOnNext}
        isLastQuestion={false}
      />
    );

    expect(screen.getByText("次の問題")).toBeInTheDocument();
    expect(screen.queryByText("結果を見る")).not.toBeInTheDocument();
  });

  it("calls onNext when button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <AnswerResult
        isCorrect={true}
        userAnswer="apple"
        correctAnswers={["apple"]}
        japaneseMeaning="りんご"
        onNext={mockOnNext}
      />
    );

    const nextButton = screen.getByText("次の問題");
    await user.click(nextButton);

    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it("handles empty or invalid input gracefully", () => {
    render(
      <AnswerResult
        isCorrect={false}
        userAnswer=""
        correctAnswers={[]}
        japaneseMeaning=""
        onNext={mockOnNext}
      />
    );

    expect(screen.getByText("不正解")).toBeInTheDocument();
    // Should not crash and should render the modal
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    render(
      <AnswerResult
        isCorrect={true}
        userAnswer="apple"
        correctAnswers={["apple"]}
        japaneseMeaning="りんご"
        onNext={mockOnNext}
      />
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-labelledby", "answer-result-title");
    expect(dialog).toHaveAttribute("aria-describedby", "answer-result-description");

    expect(screen.getByLabelText("正解！")).toBeInTheDocument();
    expect(screen.getByText("りんご")).toBeInTheDocument();
  });
});
