# @tifoji on Github
# OG idea courtesy @stephenharlinmd & based on Mobius BSM study on usethinkscript 
# https://usethinkscript.com/threads/option-greeks-calculation-labels-for-thinkorswim.399/
# K - Option strike price
# N - Standard normal cumulative distribution function
# r - Risk free interest rate
# IV - Volatility of the underlying
# S - Price of the underlying
# t - Time to option's expiry
# q - Dividend Rate
# Can go on a SPY/SPX/ES or any OptionSymbol chart

declare lower;
declare once_per_bar;

input symbol = "SPX";
input expirationDate = 230721; #hint expirationDate: Update to target expiration date as needed. 
input Strike_Spread = 5; #hint Strike_Spread: Spread between successive strikes
input Series_IV = 1; #hint Series_IV: Get the series sequence/number from TOS Option Chain Window. 
input userK = 4450;  #hint userK: Manual target strike. Typically select a strike 2x-5x OTM
input useATM = no;   #hint useATM: If set to yes, this overrides userK and sets K to the ATM Strike
input showGreeks = no;
input showPricing = no; # Show BSM Call and Put Price estimates

def year = Floor(expirationDate / 10000);
def month = Floor((expirationDate - (year * 10000)) / 100);
def day = expirationDate % 100;
def fullExpirationDate = 20000000 + expirationDate;  # Prepends "20" to expirationDate
def isRTH = RegularTradingStart(GetYYYYMMDD()) <= GetTime() and RegularTradingEnd(GetYYYYMMDD()) > GetTime();

def DayToExpiry = DaysTillDate(fullExpirationDate);
def IV = if isNaN(SeriesVolatility(underlyingSymbol = symbol, series = Series_IV))
               then IV[1]
               else SeriesVolatility(underlyingSymbol = symbol,series = Series_IV);
def S =  if(isRTH) then close(symbol=symbol) else close(symbol=symbol, aggregationPeriod.DAY) ;
def r = GetInterestRate();
def t = DayToExpiry / 365;

def ATM = if S >= Round(S / Strike_Spread, 0) * Strike_Spread
                  then Round(S/Strike_Spread, 0) * Strike_Spread
                  else (Round(S/Strike_Spread, 0) * Strike_Spread) - Strike_Spread; 

def K = if useATM then ATM else userK;

def CurrDivi = if IsNaN(GetDividend()) then CurrDivi[1] else GetDividend();
def LastDividend = if CurrDivi != CurrDivi[1] then CurrDivi[1] else LastDividend[1];
def YearlyDiv = if LastDividend == 0 then CurrDivi * 4 else if LastDividend < CurrDivi then (LastDividend * 3) + CurrDivi else YearlyDiv[1];
def q = YearlyDiv / S;

# Abramowitz and Stegun approximation for cumulative normal distribution 

script N {
    input x = 0.0;
    def b1 = 0.319381530;
    def b2 = -0.356563782;
    def b3 = 1.781477937;
    def b4 = -1.821255978;
    def b5 = 1.330274429;
    def p = 0.2316419;
    def c = 0.39894228;
    def t;
    def CND;

    if (x >= 0.0) {
        t = 1.0 / (1.0 + p * x);
        CND = 1.0 - c * Exp(-x * x / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
    } else {
        t = 1.0 / (1.0 - p * x);
        CND = c * Exp(-x * x / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
    }

    plot CumulativeNormal = CND;
}

#################### BSM Coefficients ######################################################

def d1 = (Log(S / K) + ((r - q + (Power(IV, 2)) / 2) * t)) / (IV * Sqrt(t)); # standardized return of the underlying asset over the life of the option, adjusted for volatility.
def d2 = d1 - IV * Sqrt(t); # proxy for likelihood that the option will be in the money at expiration.
def phi_d1 = Exp(-(Power(d1, 2)) / 2) / Sqrt(2 * Double.Pi); # standard normal probability density function (pdf) at d1.

#################### Option Greeks #########################################################

# Delta calculation
def Call_Delta = Exp(-q * t) * N(d1);
def Put_Delta = Exp(-q * t) * (N(d1) - 1);

# Gamma calculation
def bsmGamma = Exp(-q * t) * phi_d1 / (S * IV * Sqrt(t));
def Gamma = if IsPut then -(bsmGamma) else (bsmGamma);

# Theta calculation
def Call_Theta = -(S * Exp(-q * t) * phi_d1 * IV) / (2 * Sqrt(t)) - r * K * Exp(-r * t) * N(d2) + q * S * Exp(-q * t) * N(d1);
def Put_Theta = -(S * Exp(-q * t) * phi_d1 * IV) / (2 * Sqrt(t)) + r * K * Exp(-r * t) * (1 - N(d2)) - q * S * Exp(-q * t) * (1 - N(d1));

def Call_Theta_daily = Call_Theta / 365; # Convert yearly Theta to daily Theta
def Put_Theta_daily = Put_Theta / 365; 

# Vega calculation
def Vega = (S * Exp(-q * t) * phi_d1 * Sqrt(t))/100;

# Rho calculation
def Call_Rho = K * t * Exp(-r * t) * N(d2)/100;
def Put_Rho = -K * t * Exp(-r * t) * N(-d2)/100;

# Vanna calculation
def bsmVanna = Exp(-q * t) * Sqrt(t) * d2 * phi_d1 / IV;
plot Vanna = if IsPut then -(bsmVanna) else bsmVanna;
Vanna.SetPaintingStrategy(PaintingStrategy.HISTOGRAM);

# Volga/Vomma calculation
def Volga = Vega * (d1 * d2) / (S*IV);

# Call Option Charm
def Call_Charm = -Exp(-q * t) * (phi_d1 * ((2*r*t - d2*IV*Sqrt(t)) / (2*t*IV*Sqrt(t))) + ((2*q*t - d1*IV*Sqrt(t)) / (2*t*IV*Sqrt(t))) * N(d1) + q * N(d1));

# Put Option Charm
def Put_Charm = Exp(-q * t) * (phi_d1 * ((2*r*t - d2*IV*Sqrt(t)) / (2*t*IV*Sqrt(t))) - ((2*q*t + d1*IV*Sqrt(t)) / (2*t*IV*Sqrt(t))) * N(-d1) + q * N(-d1));

# Call Option Price
def Call_Price = S * Exp(-q * t) * N(d1) - K * Exp(-r * t) * N(d2);

# Put Option Price
def Put_Price = K * Exp(-r * t) * N(-d2) - S * Exp(-q * t) * N(-d1);


#################### Labels  ###############################################################

AddLabel(yes,(if month == 1 then "JAN"
else if month == 2 then "FEB"
else if month == 3 then "MAR"
else if month == 4 then "APR"
else if month == 5 then "MAY"
else if month == 6 then "JUN"
else if month == 7 then "JUL"
else if month == 8 then "AUG"
else if month == 9 then "SEP"
else if month == 10 then "OCT"
else if month == 11 then "NOV"
else "DEC") + " " + day + " " , CreateColor(153,153,255));
AddLabel(1, "Strike: " + AsDollars(K), color.white);
AddLabel(1, "Implied Volatility (IV) = " + AsPercent(IV), Color.WHITE);
AddLabel(1, "Vanna = " + Vanna, Color.WHITE);
AddLabel(1, "Volga = " + Volga, Color.WHITE);
AddLabel(showGreeks, "Call Delta = " + Call_Delta, Color.WHITE);
AddLabel(showGreeks, "Put Delta = " + Put_Delta, Color.WHITE);
AddLabel(showGreeks, "Gamma = " + Gamma, Color.WHITE);
AddLabel(showGreeks, "Theta(c) = " + Call_Theta_daily, Color.WHITE);
AddLabel(showGreeks, "Theta(p) = " + Put_Theta_daily, Color.WHITE);
AddLabel(showGreeks, "Vega = " + Vega, Color.WHITE);
AddLabel(showGreeks, "Call Rho = " + Call_Rho, Color.WHITE);
AddLabel(showGreeks, "Put Rho = " + Put_Rho, Color.WHITE);
AddLabel(showGreeks, "Call Charm = " + Call_Charm, Color.WHITE);
AddLabel(showGreeks, "Put Charm = " + Put_Charm, Color.WHITE);
AddLabel(showPricing, "Call Price = " + Call_Price, Color.WHITE);
AddLabel(showPricing, "Put Price = " + Put_Price, Color.WHITE);


#################### Debugging     #########################################################

#AddLabel(1, "Strike Price (K) = " + K, Color.WHITE);
#AddLabel(1, "Underlying Price (S) = " + S, Color.WHITE);
#AddLabel(1, "Risk-Free Rate (r) = " + r, Color.WHITE);
#AddLabel(1, "Time to Expiry (t) = " + t, Color.WHITE);
#AddLabel(1, "Current Dividend (CurrDivi) = " + CurrDivi, Color.WHITE);
#AddLabel(1, "Last Dividend (LastDividend) = " + LastDividend, Color.WHITE);
#AddLabel(1, "Yearly Dividend (YearlyDiv) = " + YearlyDiv, Color.WHITE);
#AddLabel(1, "Dividend Yield (q) = " + q, Color.WHITE);
#AddLabel(1, "d1 = " + d1, Color.WHITE);
#AddLabel(1, "d2 = " + d2, Color.WHITE);
#AddLabel(1, "phi_d1 = " + phi_d1, Color.WHITE);
#addLabel(1,"Days To Expiry = " + DayToExpiry,Color.WHITE);
