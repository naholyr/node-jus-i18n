var RE_MESSAGE = /^((?:\[[^\[\]]+\])|(?:\{[^\{\}]+\}))(.*?)(\|(?:(?:\[[^\[\]]+\])|(?:\{[^\{\}]+\})).*)?$/g;

// TODO : convert to JS \o/

package play.i18n;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Stack;
import java.util.StringTokenizer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Plural forms parser
 * 
 * @author nchambrier
 * @date October 2010
 */
public class PluralForm {

    public static final String MASK_RANGE_SELECTOR = "\\[[^\\[\\]]+\\]";
    public static final String MASK_EXPR_SELECTOR = "\\{[^\\{\\}]+\\}";
    public static final String MASK_SELECTOR = "(?:" + MASK_RANGE_SELECTOR + ")|(?:" + MASK_EXPR_SELECTOR + ")";
    public static final String MASK_MESSAGE = "^(" + MASK_SELECTOR + ")(.*?)(\\|(?:" + MASK_SELECTOR + ").*)?$";
    public static final Pattern RE_MESSAGE = Pattern.compile(MASK_MESSAGE);

    private ArrayList<Selector> selectors = new ArrayList<Selector>();
    private ArrayList<String> strings = new ArrayList<String>();

    public static boolean isPluralForm(String message) {
        return message.matches(MASK_MESSAGE);
    }

    private static HashMap<String, PluralForm> cache = new HashMap<String, PluralForm>();

    public static PluralForm get(String message) {
        if (!cache.containsKey(message)) {
            cache.put(message, new PluralForm(message));
        }
        return cache.get(message);
    }

    public PluralForm(String message) {
        Matcher m;
        message = message.replaceAll("\\|\\|", "||."); // encode double pipe
        while ((m = RE_MESSAGE.matcher(message)) != null) {
            if (!m.matches()) {
                break;
            }
            selectors.add(Selector.get(m.group(1)));
            strings.add(m.group(2).replaceAll("\\|\\|\\.", "|")); // transform encoded double pipe to single pipe
            message = m.group(3);
            if (message == null || message.equals("")) {
                break;
            }
            message = message.substring(1);
        }
    }

    public String get(Number n) {
        for (int i = 0; i < selectors.size(); i++) {
            if (selectors.get(i).match(n)) {
                return strings.get(i);
            }
        }
        return null;
    }

    private static abstract class Selector {

        abstract public boolean match(Number n);

        static Selector get(String s) {
            if (s.matches(MASK_RANGE_SELECTOR)) {
                return new RangeSelector(s.substring(1, s.length() - 1));
            } else if (s.matches(MASK_EXPR_SELECTOR)) {
                return new ExpressionSelector(s.substring(1, s.length() - 1));
            }
            throw new RuntimeException("Invalid plural form syntax");
        }

    }

    /**
     * Handles range selector, examples :
     * 
     * * [0] = 0
     * 
     * * [1-10] = 1 to 10
     * 
     * * [0,2,4,6] = 0, 2, 4, and 6
     * 
     * * [0,5-8] = 0 and 5 to 8
     * 
     * * ...
     */
    private static class RangeSelector extends Selector {

        static final class Range {

            long left;
            long right;

            public Range(long value) {
                this(value, value);
            }

            public Range(long left, long right) {
                this.left = left;
                this.right = right;
            }

            public boolean match(Number n) {
                return match(n.longValue());
            }

            public boolean match(long n) {
                return left <= n && n <= right;
            }

        }

        Range[] ranges;

        public RangeSelector(String s) {
            String[] rules = s.split(",");
            ranges = new Range[rules.length];
            for (int i = 0; i < rules.length; i++) {
                String rule = rules[i].trim();
                int dash = rule.indexOf('-');
                if (dash > 0) {
                    ranges[i] = new Range(parseLong(rule.substring(0, dash)), parseLong(rule.substring(dash + 1)));
                } else {
                    ranges[i] = new Range(parseLong(rule));
                }
            }
        }

        private long parseLong(String s) {
            if (s.equals("+Inf")) {
                return Long.MAX_VALUE;
            } else if (s.equals("-Inf")) {
                return Long.MIN_VALUE;
            } else {
                return Long.valueOf(s);
            }
        }

        @Override
        public boolean match(Number n) {
            for (Range range : ranges) {
                if (range.match(n)) {
                    return true;
                }
            }
            return false;
        }

    }

    /**
     * Handles expression selector, examples :
     * 
     * * {n == 3}
     * 
     * * {n % 10 == 5}
     * 
     * * {n / 2 <= 5 and n / 3 <= 3}
     * 
     * * ...
     */
    private static class ExpressionSelector extends Selector {

        static interface Operation {
            public double execute(double param1, double param2);
        }

        static class Operator {
            Operation operation;
            int precedence;

            public Operator(String token, Operation operation, int precedence) {
                this.operation = operation;
                this.precedence = precedence;
            }
        }

        @SuppressWarnings("serial")
        static final HashMap<String, Operator> OPERATORS = new HashMap<String, Operator>() {
            {
                put("or", new Operator("or", new Operation() {
                    public double execute(double param1, double param2) {
                        return (param1 != 0 || param2 != 0) ? 1 : 0;
                    }
                }, 10));
                put("and", new Operator("and", new Operation() {
                    public double execute(double param1, double param2) {
                        return (param1 != 0 && param2 != 0) ? 1 : 0;
                    }
                }, 10));
                put("=", new Operator("==", new Operation() {
                    public double execute(double param1, double param2) {
                        return param1 == param2 ? 1 : 0;
                    }
                }, 20));
                put("==", get("="));
                put("!=", new Operator("!=", new Operation() {
                    public double execute(double param1, double param2) {
                        return param1 != param2 ? 1 : 0;
                    }
                }, 20));
                put("<", new Operator("<", new Operation() {
                    public double execute(double param1, double param2) {
                        return param1 < param2 ? 1 : 0;
                    }
                }, 30));
                put("<=", new Operator("<=", new Operation() {
                    public double execute(double param1, double param2) {
                        return param1 <= param2 ? 1 : 0;
                    }
                }, 30));
                put(">", new Operator(">", new Operation() {
                    public double execute(double param1, double param2) {
                        return param1 > param2 ? 1 : 0;
                    }
                }, 30));
                put(">=", new Operator(">=", new Operation() {
                    public double execute(double param1, double param2) {
                        return param1 >= param2 ? 1 : 0;
                    }
                }, 30));
                put("+", new Operator("+", new Operation() {
                    public double execute(double param1, double param2) {
                        return param1 + param2;
                    }
                }, 40));
                put("-", new Operator("-", new Operation() {
                    public double execute(double param1, double param2) {
                        return param1 - param2;
                    }
                }, 40));
                put("%", new Operator("%", new Operation() {
                    public double execute(double param1, double param2) {
                        return param1 % param2;
                    }
                }, 50));
                put("*", new Operator("*", new Operation() {
                    public double execute(double param1, double param2) {
                        return param1 * param2;
                    }
                }, 60));
                put("/", new Operator("/", new Operation() {
                    public double execute(double param1, double param2) {
                        return param1 / param2;
                    }
                }, 60));
                put("div", new Operator("div", new Operation() {
                    public double execute(double param1, double param2) {
                        return (int) (param1 / param2);
                    }
                }, 60));
            }
        };

        static final Pattern PARENS = Pattern.compile("^(.*?)\\(([^\\(\\)]+)\\)(.*)$");

        String filter;

        public ExpressionSelector(String s) {
            filter = s.replaceAll("%|==|!=|<=|>=|<|>|=|\\+|-|\\*|/|\\(|\\)|or|and|div|n", " $0 ");
        }

        @Override
        public boolean match(Number n) {
            Double result = null;
            String expression = filter.replaceAll(" n ", " " + n.longValue() + " ");
            Matcher matcher;
            while (expression != null && (matcher = PARENS.matcher(expression)) != null) {
                // Detect expression
                String current;
                if (matcher.matches()) {
                    expression = matcher.group(1) + " {EXPR} " + matcher.group(3);
                    current = matcher.group(2);
                } else {
                    current = expression;
                    expression = null;
                }
                // Parse expression
                StringTokenizer tokenizer = new StringTokenizer(current, " ");
                Stack<Object> stack = new Stack<Object>();
                while (tokenizer.hasMoreTokens()) {
                    String token = tokenizer.nextToken();
                    boolean reduce = false;
                    Operator operator = null;
                    if (OPERATORS.containsKey(token)) {
                        if (!stack.isEmpty() && !(stack.lastElement() instanceof Double)) {
                            throw new RuntimeException("Invalid expression : unexpected operator");
                        }
                        operator = OPERATORS.get(token);
                        if (stack.size() >= 2) {
                            Operator previousOperator = (Operator) stack.get(stack.size() - 2);
                            if (previousOperator.precedence > operator.precedence) {
                                reduce = true;
                            }
                        }
                    } else {
                        if (!stack.isEmpty() && !(stack.lastElement() instanceof Operator)) {
                            throw new RuntimeException("Invalid expression : unexpected number");
                        }
                        stack.push(Double.valueOf(token));
                    }
                    if (!tokenizer.hasMoreElements()) {
                        reduce = true;
                    }
                    if (reduce) {
                        if (stack.size() == 0) {
                            throw new RuntimeException("Invalid expression : unexpected end");
                        }
                        Double right = (Double) stack.pop();
                        while (stack.size() >= 2) {
                            Operator op = (Operator) stack.pop();
                            if (operator != null && op.precedence < operator.precedence) {
                                stack.push(op);
                                break;
                            }
                            Double left = (Double) stack.pop();
                            right = op.operation.execute(left, right);
                        }
                        stack.push(right);
                    }
                    if (operator != null) {
                        stack.push(operator);
                    }
                }
                if (stack.size() != 1) {
                    throw new RuntimeException("Invalid expression : failed");
                }
                result = (Double) stack.lastElement();
                // Complete expression
                if (expression != null) {
                    expression = expression.replace("{EXPR}", String.valueOf(result));
                }
            }
            return result != null && result.intValue() != 0;
        }

    }

}

