# -----------------------------------
# Demark implementation tifoji@github
# -----------------------------------

# Formation Phase:
# - Buy Formation: Sequence of bars with Close lower than the Close 4 bars ago.
# - Sell Formation: Sequence of bars with Close higher than the Close 4 bars ago.
# - Formation phase completes after 9 bars (DeMark Sequential standard).

# Intersection Condition:
# - Buy Intersection: Bar's High is greater or equal to the Low from 3 bars ago.
# - Sell Intersection: Bar's Low is less or equal to the High from 3 bars ago.

# Array Phase:
# - Begins after the Formation phase and Intersection condition are met.
# - Buy Array Pattern: Bars (not necessarily successive) with Close not greater than the Low from 2 bars ago.
# - Sell Array Pattern: Bars (not necessarily successive) with Close not less than the High from 2 bars ago.
# - Array phase typically completes after 13 bars (DeMark Sequential standard).

# Perfection Criteria:
# - Refines the signals from Formation and Array phases to ensure they are more significant.
# - Buy Formation Perfection: Current or previous bar's Low is less than Lows from 2 and 3 bars ago.
# - Sell Formation Perfection: Current or previous bar's High is greater than Highs from 2 and 3 bars ago.
# - Buy Array Perfection: Current bar's Low is less or equal to the Close from 5 bars ago.
# - Sell Array Perfection: Current bar's High is greater or equal to the Close from 5 bars ago.

# Signals:
# - BuySignal: Plotted after Buy Formation is complete and meets either Buy Formation Perfection or Buy Array Perfection.
# - SellSignal: Plotted after Sell Formation is complete and meets either Sell Formation Perfection or Sell Array Perfection.

# -----------------------------------

input symbol = "SPY";

# Definitions
def O = open(symbol=symbol);
def H = high(symbol=symbol);
def L = low(symbol=symbol);
def C = if !IsNaN(close(symbol=symbol)) then close(symbol=symbol) 
        else if !IsNaN(close(symbol=symbol, aggregationPeriod.DAY, PriceType.LAST)) then close(symbol=symbol, aggregationPeriod.DAY, PriceType.LAST) 
        else close(symbol=symbol, aggregationPeriod.DAY, PriceType.LAST)[1];
def CustomOHLC4 = (O + H + L + C) / 4;

# Formation Phase with Count
def BuyFormationCount = if C < C[4] then BuyFormationCount[1] + 1 else 0;
def SellFormationCount = if C > C[4] then SellFormationCount[1] + 1 else 0;

def BuyFormationComplete = BuyFormationCount == 9;  # Completed after 9 bars
def SellFormationComplete = SellFormationCount == 9;  # Completed after 9 bars

# Intersection Condition
def BuyIntersection = H >= L[3];
def SellIntersection = L <= H[3];

# Start of Array phase
def StartBuyArrayBar = if BuyFormationComplete and BuyIntersection then barNumber() else StartBuyArrayBar[1];
def StartSellArrayBar = if SellFormationComplete and SellIntersection then barNumber() else StartSellArrayBar[1];

# Counting bars in the Array phase
def BuyArrayCount = if barNumber() > StartBuyArrayBar and C <= L[2] then BuyArrayCount[1] + 1 else if barNumber() > StartBuyArrayBar then BuyArrayCount[1] else 0;
def SellArrayCount = if barNumber() > StartSellArrayBar and C >= H[2] then SellArrayCount[1] + 1 else if barNumber() > StartSellArrayBar then SellArrayCount[1] else 0;

# Array criteria based on the description
def BuyArrayCondition = C <= L[2];
def SellArrayCondition = C >= H[2];

# Perfection Criteria
def BuyFormationPerfection = (L < L[2] and L < L[3]) or (L[1] < L[2] and L[1] < L[3]);
def SellFormationPerfection = (H > H[2] and H > H[3]) or (H[1] > H[2] and H[1] > H[3]);
def BuyArrayPerfection = L <= C[5];
def SellArrayPerfection = H >= C[5];

# Signals based on Array and Perfection Criteria
plot BuySignal = BuyFormationComplete and (BuyFormationPerfection or BuyArrayPerfection) and BuyArrayCondition and BuyArrayCount <= 13;
plot SellSignal = SellFormationComplete and (SellFormationPerfection or SellArrayPerfection) and SellArrayCondition and SellArrayCount <= 13;

