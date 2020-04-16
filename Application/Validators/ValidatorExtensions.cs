using FluentValidation;

namespace Application.Validators
{
    public static class ValidatorExtensions
    {
        public static IRuleBuilder<T, string> Password<T>(this IRuleBuilder<T, string> ruleBuilder)
        {
            var options = ruleBuilder
                .NotEmpty()
                .MinimumLength(6).WithMessage("Password must be at least six characters")
                .Matches("[A-Z]").WithMessage("Password must contain one uppercase letter")
                .Matches("[0-9]").WithMessage("Password must have at least one digit")
                .Matches("[a-z]").WithMessage("Password must have at least one lower case character")
                .Matches("[^a-zA-Z0-9]").WithMessage("Password must have at least one alphanumeric character");

            return options;
        }
    }
}