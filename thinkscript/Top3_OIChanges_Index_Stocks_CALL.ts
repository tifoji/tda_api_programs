# ----------------------------------------------------------------------------------------------------------------------------
# tifoji@github
# # v1 - Initial version to be tested across timeframes for accuracy and performance. 
# ----------------------------------------------------------------------------------------------------------------------------

declare upper;
declare real_size;
#declare once_per_bar;

input symbol = "SPX";
input suffix = "";
input ITMC = 10; #hint ITMC: Max number of strikes itm. Max 10
input OTMC = 25; #hint OTMC: Max number of strikes otm. Max 125
input strike_price_interval = 5; # Increment to adjust strike price
#input useOpenATM = yes; # Default to OpenATM
input userK = 0; # Empty input for manual ATM strike
input useManualExpiration = yes;
input manualExpirationDate = 231215; # Manual expiration date if set to yes
input additionalDaysToPlot = 0 ;
input showLabels = yes;
input bubbleOffset = 10;

########################################################################################################################
##################################   Date & TIme Related ###############################################################

# Expiration Date Handling
def currentYear = GetYear();
def expirationYear = currentYear % 100;
def currentMonth = GetMonth();
def currentDay = GetDayOfMonth(GetYYYYMMDD());
def defaultExpirationDate = (currentYear % 100) * 10000 + currentMonth * 100 + currentDay;
def expirationDate = if useManualExpiration then manualExpirationDate else defaultExpirationDate;
def expirationMonth = RoundDown((expirationDate % 10000) / 100, 0);
def expirationDay = expirationDate % 100;

###########################################################################################################################
################################## Reusable Latest Session Logic  #########################################################

# Identify a new day/session start
def yearstart = GetYear() * 10000 + 101;
def trading_days = if IsNaN(close) then trading_days[1] else CountTradingDays(yearstart, GetYYYYMMDD());
def isSessionStart = trading_days != trading_days[1];
# Count the number of days back from the current bar
rec dayCounter = if BarNumber() == 0 then 0 else if isSessionStart then dayCounter[1] + 1 else dayCounter[1];
# Identify the latest session (Add vertical line for the latest session later in code)
def isLatestSession = HighestAll(dayCounter) == dayCounter;
# Display sessions in effect. 
def displaySession = isLatestSession or (dayCounter <= (HighestAll(dayCounter) - 1) and dayCounter >= (HighestAll(dayCounter) - additionalDaysToPlot));
def isRTH = GetTime() >= RegularTradingStart(GetYYYYMMDD()) and GetTime() < RegularTradingEnd(GetYYYYMMDD());
def isDailyOrHigher = GetAggregationPeriod() >= AggregationPeriod.DAY;

###########################################################################################################################
################################## ATM  Calculation #######################################################################

# Open Price
def todayOpen = open(symbol = symbol, period = AggregationPeriod.DAY);
def yesterdayOpen = open(symbol = symbol, period = AggregationPeriod.DAY)[1];
#def lastPrice = close(symbol = symbol,period = "DAY")[1];
def lastPrice = if !IsNaN(close(symbol = symbol, period = AggregationPeriod.DAY)) then close(symbol = symbol, period = AggregationPeriod.DAY) else lastPrice[1];

def openPrice = if !IsNaN(todayOpen) then todayOpen 
                else if !IsNaN(yesterdayOpen) then yesterdayOpen 
                else lastPrice;
# Open ATM 
def openATM = if openPrice >= Round(openPrice / strike_price_interval, 0) * strike_price_interval
              then Round(openPrice / strike_price_interval, 0) * strike_price_interval
              else (Round(openPrice / strike_price_interval, 0) * strike_price_interval) - strike_price_interval;

# Close ATM
def closeATM = if lastPrice >= Round(lastPrice / strike_price_interval, 0) * strike_price_interval
              then Round(lastPrice / strike_price_interval, 0) * strike_price_interval
              else (Round(lastPrice / strike_price_interval, 0) * strike_price_interval) - strike_price_interval;

# Determine ATM Strike based on user choices
def AtmStrike = if !IsNaN(userK) and userK != 0 then userK else openATM; # 

###########################################################################################################################
#############################################################################################################################################################################################################

script OIChange {
    input symbol = "";
    input suffix = "";
    input expirationDate = 0;
    input optionType = {"C", default "P"};
    input strike = 0;
    #input displaySession = yes;

    def oiseriestoday = if !IsNaN(open_interest("." + symbol + suffix + AsPrice(expirationDate) + optionType + AsPrice(strike), period = AggregationPeriod.DAY)) then open_interest("." + symbol + suffix + AsPrice(expirationDate) + optionType + AsPrice(strike), period = AggregationPeriod.DAY) else 0;

    def oiseriesyesterday = if !IsNaN(open_interest("." + symbol + suffix + AsPrice(expirationDate) + optionType + AsPrice(strike), period = AggregationPeriod.DAY)[1]) then open_interest("." + symbol + suffix + AsPrice(expirationDate) + optionType + AsPrice(strike), period = AggregationPeriod.DAY)[1] else 0;

    def oichange = oiseriestoday - oiseriesyesterday ;

    plot oic = oichange;
    #plot oitoday = oiseriestoday;
    #plot oiyesterday = oiseriesyesterday;
}
###########################################################################################################################
###########################################################################################################################

# ITM Call Strikes
#def callITMstrike1 = if displaySession and ITMC >= 1 then AtmStrike - strike_price_interval * 1 else 0;
def callITMstrike1 = if  ITMC >= 1 then AtmStrike - strike_price_interval * 1 else Double.NaN;
def callITMstrike2 = if  ITMC >= 2 then AtmStrike - strike_price_interval * 2 else Double.NaN;
def callITMstrike3 = if  ITMC >= 3 then AtmStrike - strike_price_interval * 3 else Double.NaN;
def callITMstrike4 = if  ITMC >= 4 then AtmStrike - strike_price_interval * 4 else Double.NaN;
def callITMstrike5 = if  ITMC >= 5 then AtmStrike - strike_price_interval * 5 else Double.NaN;
def callITMstrike6 = if  ITMC >= 6 then AtmStrike - strike_price_interval * 6 else Double.NaN;
def callITMstrike7 = if  ITMC >= 7 then AtmStrike - strike_price_interval * 7 else Double.NaN;
def callITMstrike8 = if  ITMC >= 8 then AtmStrike - strike_price_interval * 8 else Double.NaN;
def callITMstrike9 = if  ITMC >= 9 then AtmStrike - strike_price_interval * 9 else Double.NaN;
def callITMstrike10 = if ITMC >= 10 then AtmStrike - strike_price_interval * 10 else Double.NaN;

# OTM Call Strikes
def callOTMstrike1 = if OTMC >= 1 then AtmStrike + strike_price_interval * 1 else Double.NaN;
def callOTMstrike2 = if OTMC >= 2 then AtmStrike + strike_price_interval * 2 else Double.NaN;
def callOTMstrike3 = if OTMC >= 3 then AtmStrike + strike_price_interval * 3 else Double.NaN;
def callOTMstrike4 = if OTMC >= 4 then AtmStrike + strike_price_interval * 4 else Double.NaN;
def callOTMstrike5 = if OTMC >= 5 then AtmStrike + strike_price_interval * 5 else Double.NaN;
def callOTMstrike6 = if OTMC >= 6 then AtmStrike + strike_price_interval * 6 else Double.NaN;
def callOTMstrike7 = if OTMC >= 7 then AtmStrike + strike_price_interval * 7 else Double.NaN;
def callOTMstrike8 = if OTMC >= 8 then AtmStrike + strike_price_interval * 8 else Double.NaN;
def callOTMstrike9 = if OTMC >= 9 then AtmStrike + strike_price_interval * 9 else Double.NaN;
def callOTMstrike10 = if OTMC >= 10 then AtmStrike + strike_price_interval * 10 else Double.NaN;
def callOTMstrike11 = if OTMC >= 11 then AtmStrike + strike_price_interval * 11 else Double.NaN;
def callOTMstrike12 = if OTMC >= 12 then AtmStrike + strike_price_interval * 12 else Double.NaN;
def callOTMstrike13 = if OTMC >= 13 then AtmStrike + strike_price_interval * 13 else Double.NaN;
def callOTMstrike14 = if OTMC >= 14 then AtmStrike + strike_price_interval * 14 else Double.NaN;
def callOTMstrike15 = if OTMC >= 15 then AtmStrike + strike_price_interval * 15 else Double.NaN;
def callOTMstrike16 = if OTMC >= 16 then AtmStrike + strike_price_interval * 16 else Double.NaN;
def callOTMstrike17 = if OTMC >= 17 then AtmStrike + strike_price_interval * 17 else Double.NaN;
def callOTMstrike18 = if OTMC >= 18 then AtmStrike + strike_price_interval * 18 else Double.NaN;
def callOTMstrike19 = if OTMC >= 19 then AtmStrike + strike_price_interval * 19 else Double.NaN;
def callOTMstrike20 = if OTMC >= 20 then AtmStrike + strike_price_interval * 20 else Double.NaN;
def callOTMstrike21 = if OTMC >= 21 then AtmStrike + strike_price_interval * 21 else Double.NaN;
def callOTMstrike22 = if OTMC >= 22 then AtmStrike + strike_price_interval * 22 else Double.NaN;
def callOTMstrike23 = if OTMC >= 23 then AtmStrike + strike_price_interval * 23 else Double.NaN;
def callOTMstrike24 = if OTMC >= 24 then AtmStrike + strike_price_interval * 24 else Double.NaN;
def callOTMstrike25 = if OTMC >= 25 then AtmStrike + strike_price_interval * 25 else Double.NaN;

###########################################################################################################################
#########################################  ITM OI CHANGES  ################################################################
def ITMCallOIChange1 = OIChange(symbol, suffix, expirationDate, "C", callITMstrike1).oic;
def ITMCallOIChange2 = OIChange(symbol, suffix, expirationDate, "C", callITMstrike2).oic;
def ITMCallOIChange3 = OIChange(symbol, suffix, expirationDate, "C", callITMstrike3).oic;
def ITMCallOIChange4 = OIChange(symbol, suffix, expirationDate, "C", callITMstrike4).oic;
def ITMCallOIChange5 = OIChange(symbol, suffix, expirationDate, "C", callITMstrike5).oic;
def ITMCallOIChange6 = OIChange(symbol, suffix, expirationDate, "C", callITMstrike6).oic;
def ITMCallOIChange7 = OIChange(symbol, suffix, expirationDate, "C", callITMstrike7).oic;
def ITMCallOIChange8 = OIChange(symbol, suffix, expirationDate, "C", callITMstrike8).oic;
def ITMCallOIChange9 = OIChange(symbol, suffix, expirationDate, "C", callITMstrike9).oic;
def ITMCallOIChange10 = OIChange(symbol, suffix, expirationDate, "C", callITMstrike10).oic;

# Finding the HIGHEST OI change
def maxITMOIChange1 = Max(Max(Max(Max(Max(Max(Max(Max(Max(
    AbsValue(ITMCallOIChange1), AbsValue(ITMCallOIChange2)), 
    AbsValue(ITMCallOIChange3)), AbsValue(ITMCallOIChange4)), 
    AbsValue(ITMCallOIChange5)), AbsValue(ITMCallOIChange6)), 
    AbsValue(ITMCallOIChange7)), AbsValue(ITMCallOIChange8)), 
    AbsValue(ITMCallOIChange9)), AbsValue(ITMCallOIChange10));

# Identifying which strike corresponds to maxOIChange1
def strikeITMMax1 = 
    if AbsValue(ITMCallOIChange1) == maxITMOIChange1 then callITMstrike1 
    else if AbsValue(ITMCallOIChange2) == maxITMOIChange1 then callITMstrike2 
    else if AbsValue(ITMCallOIChange3) == maxITMOIChange1 then callITMstrike3 
    else if AbsValue(ITMCallOIChange4) == maxITMOIChange1 then callITMstrike4 
    else if AbsValue(ITMCallOIChange5) == maxITMOIChange1 then callITMstrike5 
    else if AbsValue(ITMCallOIChange6) == maxITMOIChange1 then callITMstrike6 
    else if AbsValue(ITMCallOIChange7) == maxITMOIChange1 then callITMstrike7 
    else if AbsValue(ITMCallOIChange8) == maxITMOIChange1 then callITMstrike8 
    else if AbsValue(ITMCallOIChange9) == maxITMOIChange1 then callITMstrike9 
    else if AbsValue(ITMCallOIChange10) == maxITMOIChange1 then callITMstrike10
    else Double.NaN;

# Finding the SECOND HIGHEST OI change and its associated strike
def maxITMOIChange2 = Max(Max(Max(Max(Max(Max(Max(Max(Max(
    if AbsValue(ITMCallOIChange1) != maxITMOIChange1 then AbsValue(ITMCallOIChange1) else 0, 
    if AbsValue(ITMCallOIChange2) != maxITMOIChange1 then AbsValue(ITMCallOIChange2) else 0), 
    if AbsValue(ITMCallOIChange3) != maxITMOIChange1 then AbsValue(ITMCallOIChange3) else 0), 
    if AbsValue(ITMCallOIChange4) != maxITMOIChange1 then AbsValue(ITMCallOIChange4) else 0), 
    if AbsValue(ITMCallOIChange5) != maxITMOIChange1 then AbsValue(ITMCallOIChange5) else 0), 
    if AbsValue(ITMCallOIChange6) != maxITMOIChange1 then AbsValue(ITMCallOIChange6) else 0), 
    if AbsValue(ITMCallOIChange7) != maxITMOIChange1 then AbsValue(ITMCallOIChange7) else 0), 
    if AbsValue(ITMCallOIChange8) != maxITMOIChange1 then AbsValue(ITMCallOIChange8) else 0), 
    if AbsValue(ITMCallOIChange9) != maxITMOIChange1 then AbsValue(ITMCallOIChange9) else 0), 
    if AbsValue(ITMCallOIChange10) != maxITMOIChange1 then AbsValue(ITMCallOIChange10) else 0);

# Identifying which strike corresponds to maxOIChange2
def strikeITMMax2 = 
    if AbsValue(ITMCallOIChange1) == maxITMOIChange2 then callITMstrike1 
    else if AbsValue(ITMCallOIChange2) == maxITMOIChange2 then callITMstrike2 
    else if AbsValue(ITMCallOIChange3) == maxITMOIChange2 then callITMstrike3 
    else if AbsValue(ITMCallOIChange4) == maxITMOIChange2 then callITMstrike4 
    else if AbsValue(ITMCallOIChange5) == maxITMOIChange2 then callITMstrike5 
    else if AbsValue(ITMCallOIChange6) == maxITMOIChange2 then callITMstrike6 
    else if AbsValue(ITMCallOIChange7) == maxITMOIChange2 then callITMstrike7 
    else if AbsValue(ITMCallOIChange8) == maxITMOIChange2 then callITMstrike8 
    else if AbsValue(ITMCallOIChange9) == maxITMOIChange2 then callITMstrike9 
    else if AbsValue(ITMCallOIChange10) == maxITMOIChange2 then callITMstrike10
    else Double.NaN;

# Finding the THIRD HIGHEST OI change and its associated strike
def maxITMOIChange3 = Max(Max(Max(Max(Max(Max(Max(Max(Max(
    if AbsValue(ITMCallOIChange1) != maxITMOIChange1 and AbsValue(ITMCallOIChange1) != maxITMOIChange2 then AbsValue(ITMCallOIChange1) else 0, 
    if AbsValue(ITMCallOIChange2) != maxITMOIChange1 and AbsValue(ITMCallOIChange2) != maxITMOIChange2 then AbsValue(ITMCallOIChange2) else 0), 
    if AbsValue(ITMCallOIChange3) != maxITMOIChange1 and AbsValue(ITMCallOIChange3) != maxITMOIChange2 then AbsValue(ITMCallOIChange3) else 0), 
    if AbsValue(ITMCallOIChange4) != maxITMOIChange1 and AbsValue(ITMCallOIChange4) != maxITMOIChange2 then AbsValue(ITMCallOIChange4) else 0), 
    if AbsValue(ITMCallOIChange5) != maxITMOIChange1 and AbsValue(ITMCallOIChange5) != maxITMOIChange2 then AbsValue(ITMCallOIChange5) else 0), 
    if AbsValue(ITMCallOIChange6) != maxITMOIChange1 and AbsValue(ITMCallOIChange6) != maxITMOIChange2 then AbsValue(ITMCallOIChange6) else 0), 
    if AbsValue(ITMCallOIChange7) != maxITMOIChange1 and AbsValue(ITMCallOIChange7) != maxITMOIChange2 then AbsValue(ITMCallOIChange7) else 0), 
    if AbsValue(ITMCallOIChange8) != maxITMOIChange1 and AbsValue(ITMCallOIChange8) != maxITMOIChange2 then AbsValue(ITMCallOIChange8) else 0), 
    if AbsValue(ITMCallOIChange9) != maxITMOIChange1 and AbsValue(ITMCallOIChange9) != maxITMOIChange2 then AbsValue(ITMCallOIChange9) else 0), 
    if AbsValue(ITMCallOIChange10) != maxITMOIChange1 and AbsValue(ITMCallOIChange10) != maxITMOIChange2 then ITMCallOIChange10 else 0);

# Identifying which strike corresponds to maxOIChange3
def strikeITMMax3 = 
    if AbsValue(ITMCallOIChange1) == maxITMOIChange3 then callITMstrike1 
    else if AbsValue(ITMCallOIChange2) == maxITMOIChange3 then callITMstrike2 
    else if AbsValue(ITMCallOIChange3) == maxITMOIChange3 then callITMstrike3 
    else if AbsValue(ITMCallOIChange4) == maxITMOIChange3 then callITMstrike4 
    else if AbsValue(ITMCallOIChange5) == maxITMOIChange3 then callITMstrike5 
    else if AbsValue(ITMCallOIChange6) == maxITMOIChange3 then callITMstrike6 
    else if AbsValue(ITMCallOIChange7) == maxITMOIChange3 then callITMstrike7 
    else if AbsValue(ITMCallOIChange8) == maxITMOIChange3 then callITMstrike8 
    else if AbsValue(ITMCallOIChange9) == maxITMOIChange3 then callITMstrike9 
    else callITMstrike10;

###########################################################################################################################
#########################################  OTM OI CHANGES  ################################################################

###OTM OI CHANGES
def OTMCallOIChange1 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike1).oic;
def OTMCallOIChange2 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike2).oic;
def OTMCallOIChange3 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike3).oic;
def OTMCallOIChange4 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike4).oic;
def OTMCallOIChange5 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike5).oic;
def OTMCallOIChange6 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike6).oic;
def OTMCallOIChange7 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike7).oic;
def OTMCallOIChange8 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike8).oic;
def OTMCallOIChange9 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike9).oic;
def OTMCallOIChange10 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike10).oic;
def OTMCallOIChange11 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike11).oic;
def OTMCallOIChange12 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike12).oic;
def OTMCallOIChange13 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike13).oic;
def OTMCallOIChange14 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike14).oic;
def OTMCallOIChange15 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike15).oic;
def OTMCallOIChange16 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike16).oic;
def OTMCallOIChange17 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike17).oic;
def OTMCallOIChange18 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike18).oic;
def OTMCallOIChange19 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike19).oic;
def OTMCallOIChange20 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike20).oic;
def OTMCallOIChange21 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike21).oic;
def OTMCallOIChange22 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike22).oic;
def OTMCallOIChange23 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike23).oic;
def OTMCallOIChange24 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike24).oic;
def OTMCallOIChange25 = OIChange(symbol, suffix, expirationDate, "C", callOTMstrike25).oic;

# Finding the HIGHEST OI change and its associated strike
def maxOTMOIChange1 = Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(
    AbsValue(OTMCallOIChange1), AbsValue(OTMCallOIChange2)), 
    AbsValue(OTMCallOIChange3)), AbsValue(OTMCallOIChange4)), 
    AbsValue(OTMCallOIChange5)), AbsValue(OTMCallOIChange6)), 
    AbsValue(OTMCallOIChange7)), AbsValue(OTMCallOIChange8)), 
    AbsValue(OTMCallOIChange9)), AbsValue(OTMCallOIChange10)),
    AbsValue(OTMCallOIChange11)), AbsValue(OTMCallOIChange12)), 
    AbsValue(OTMCallOIChange13)), AbsValue(OTMCallOIChange14)), 
    AbsValue(OTMCallOIChange15)), AbsValue(OTMCallOIChange16)), 
    AbsValue(OTMCallOIChange17)), AbsValue(OTMCallOIChange18)), 
    AbsValue(OTMCallOIChange19)), AbsValue(OTMCallOIChange20)),
    AbsValue(OTMCallOIChange21)), AbsValue(OTMCallOIChange22)), 
    AbsValue(OTMCallOIChange23)), AbsValue(OTMCallOIChange24)), 
    AbsValue(OTMCallOIChange25));

# Identifying which strike corresponds to maxOTMOIChange1
def strikeOTMMax1 = if AbsValue(OTMCallOIChange1) == maxOTMOIChange1 then callOTMstrike1 
                 else if AbsValue(OTMCallOIChange2) == maxOTMOIChange1 then callOTMstrike2 
                 else if AbsValue(OTMCallOIChange3) == maxOTMOIChange1 then callOTMstrike3 
                 else if AbsValue(OTMCallOIChange4) == maxOTMOIChange1 then callOTMstrike4 
                 else if AbsValue(OTMCallOIChange5) == maxOTMOIChange1 then callOTMstrike5 
                 else if AbsValue(OTMCallOIChange6) == maxOTMOIChange1 then callOTMstrike6 
                 else if AbsValue(OTMCallOIChange7) == maxOTMOIChange1 then callOTMstrike7 
                 else if AbsValue(OTMCallOIChange8) == maxOTMOIChange1 then callOTMstrike8 
                 else if AbsValue(OTMCallOIChange9) == maxOTMOIChange1 then callOTMstrike9
                 else if AbsValue(OTMCallOIChange10) == maxOTMOIChange1 then callOTMstrike10
                 else if AbsValue(OTMCallOIChange11) == maxOTMOIChange1 then callOTMstrike11
                 else if AbsValue(OTMCallOIChange12) == maxOTMOIChange1 then callOTMstrike12
                 else if AbsValue(OTMCallOIChange13) == maxOTMOIChange1 then callOTMstrike13
                 else if AbsValue(OTMCallOIChange14) == maxOTMOIChange1 then callOTMstrike14
                 else if AbsValue(OTMCallOIChange15) == maxOTMOIChange1 then callOTMstrike15
                 else if AbsValue(OTMCallOIChange16) == maxOTMOIChange1 then callOTMstrike16
                 else if AbsValue(OTMCallOIChange17) == maxOTMOIChange1 then callOTMstrike17
                 else if AbsValue(OTMCallOIChange18) == maxOTMOIChange1 then callOTMstrike18
                 else if AbsValue(OTMCallOIChange19) == maxOTMOIChange1 then callOTMstrike19
                 else if AbsValue(OTMCallOIChange20) == maxOTMOIChange1 then callOTMstrike20
                 else if AbsValue(OTMCallOIChange21) == maxOTMOIChange1 then callOTMstrike21
                 else if AbsValue(OTMCallOIChange22) == maxOTMOIChange1 then callOTMstrike22
                 else if AbsValue(OTMCallOIChange23) == maxOTMOIChange1 then callOTMstrike23
                 else if AbsValue(OTMCallOIChange24) == maxOTMOIChange1 then callOTMstrike24
                 else if AbsValue(OTMCallOIChange25) == maxOTMOIChange1 then callOTMstrike25
                 else Double.NaN;

# Finding the SECOND HIGHEST OI change and its associated strike
def maxOTMOIChange2 = Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(
    if AbsValue(OTMCallOIChange1) != maxOTMOIChange1 then AbsValue(OTMCallOIChange1) else 0,
    if AbsValue(OTMCallOIChange2) != maxOTMOIChange1 then AbsValue(OTMCallOIChange2) else 0),
    if AbsValue(OTMCallOIChange3) != maxOTMOIChange1 then AbsValue(OTMCallOIChange3) else 0),
    if AbsValue(OTMCallOIChange4) != maxOTMOIChange1 then AbsValue(OTMCallOIChange4) else 0),
    if AbsValue(OTMCallOIChange5) != maxOTMOIChange1 then AbsValue(OTMCallOIChange5) else 0),
    if AbsValue(OTMCallOIChange6) != maxOTMOIChange1 then AbsValue(OTMCallOIChange6) else 0),
    if AbsValue(OTMCallOIChange7) != maxOTMOIChange1 then AbsValue(OTMCallOIChange7) else 0),
    if AbsValue(OTMCallOIChange8) != maxOTMOIChange1 then AbsValue(OTMCallOIChange8) else 0),
    if AbsValue(OTMCallOIChange9) != maxOTMOIChange1 then AbsValue(OTMCallOIChange9) else 0),
    if AbsValue(OTMCallOIChange10) != maxOTMOIChange1 then AbsValue(OTMCallOIChange10) else 0),
    if AbsValue(OTMCallOIChange11) != maxOTMOIChange1 then AbsValue(OTMCallOIChange11) else 0),
    if AbsValue(OTMCallOIChange12) != maxOTMOIChange1 then AbsValue(OTMCallOIChange12) else 0),
    if AbsValue(OTMCallOIChange13) != maxOTMOIChange1 then AbsValue(OTMCallOIChange13) else 0),
    if AbsValue(OTMCallOIChange14) != maxOTMOIChange1 then AbsValue(OTMCallOIChange14) else 0),
    if AbsValue(OTMCallOIChange15) != maxOTMOIChange1 then AbsValue(OTMCallOIChange15) else 0),
    if AbsValue(OTMCallOIChange16) != maxOTMOIChange1 then AbsValue(OTMCallOIChange16) else 0),
    if AbsValue(OTMCallOIChange17) != maxOTMOIChange1 then AbsValue(OTMCallOIChange17) else 0),
    if AbsValue(OTMCallOIChange18) != maxOTMOIChange1 then AbsValue(OTMCallOIChange18) else 0),
    if AbsValue(OTMCallOIChange19) != maxOTMOIChange1 then AbsValue(OTMCallOIChange19) else 0),
    if AbsValue(OTMCallOIChange20) != maxOTMOIChange1 then AbsValue(OTMCallOIChange20) else 0),
    if AbsValue(OTMCallOIChange21) != maxOTMOIChange1 then AbsValue(OTMCallOIChange21) else 0),
    if AbsValue(OTMCallOIChange22) != maxOTMOIChange1 then AbsValue(OTMCallOIChange22) else 0),
    if AbsValue(OTMCallOIChange23) != maxOTMOIChange1 then AbsValue(OTMCallOIChange23) else 0),
    if AbsValue(OTMCallOIChange24) != maxOTMOIChange1 then AbsValue(OTMCallOIChange24) else 0),
    if AbsValue(OTMCallOIChange25) != maxOTMOIChange1 then AbsValue(OTMCallOIChange25) else 0);

# Identifying which strike corresponds to maxOIChange2
def strikeOTMMax2 = 
    if AbsValue(OTMCallOIChange1) == maxOTMOIChange2 then callOTMstrike1
    else if AbsValue(OTMCallOIChange2) == maxOTMOIChange2 then callOTMstrike2
    else if AbsValue(OTMCallOIChange3) == maxOTMOIChange2 then callOTMstrike3
    else if AbsValue(OTMCallOIChange4) == maxOTMOIChange2 then callOTMstrike4
    else if AbsValue(OTMCallOIChange5) == maxOTMOIChange2 then callOTMstrike5
    else if AbsValue(OTMCallOIChange6) == maxOTMOIChange2 then callOTMstrike6
    else if AbsValue(OTMCallOIChange7) == maxOTMOIChange2 then callOTMstrike7
    else if AbsValue(OTMCallOIChange8) == maxOTMOIChange2 then callOTMstrike8
    else if AbsValue(OTMCallOIChange9) == maxOTMOIChange2 then callOTMstrike9
    else if AbsValue(OTMCallOIChange10) == maxOTMOIChange2 then callOTMstrike10
    else if AbsValue(OTMCallOIChange11) == maxOTMOIChange2 then callOTMstrike11
    else if AbsValue(OTMCallOIChange12) == maxOTMOIChange2 then callOTMstrike12
    else if AbsValue(OTMCallOIChange13) == maxOTMOIChange2 then callOTMstrike13
    else if AbsValue(OTMCallOIChange14) == maxOTMOIChange2 then callOTMstrike14
    else if AbsValue(OTMCallOIChange15) == maxOTMOIChange2 then callOTMstrike15
    else if AbsValue(OTMCallOIChange16) == maxOTMOIChange2 then callOTMstrike16
    else if AbsValue(OTMCallOIChange17) == maxOTMOIChange2 then callOTMstrike17
    else if AbsValue(OTMCallOIChange18) == maxOTMOIChange2 then callOTMstrike18
    else if AbsValue(OTMCallOIChange19) == maxOTMOIChange2 then callOTMstrike19
    else if AbsValue(OTMCallOIChange20) == maxOTMOIChange2 then callOTMstrike20
    else if AbsValue(OTMCallOIChange21) == maxOTMOIChange2 then callOTMstrike21
    else if AbsValue(OTMCallOIChange22) == maxOTMOIChange2 then callOTMstrike22
    else if AbsValue(OTMCallOIChange23) == maxOTMOIChange2 then callOTMstrike23
    else if AbsValue(OTMCallOIChange24) == maxOTMOIChange2 then callOTMstrike24
    else callOTMstrike25;

# Finding the THIRD HIGHEST OI change and its associated strike
def maxOTMOIChange3 = Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(
if AbsValue(OTMCallOIChange1) != maxOTMOIChange1 and AbsValue(OTMCallOIChange1) != maxOTMOIChange2 then AbsValue(OTMCallOIChange1) else 0,
    if AbsValue(OTMCallOIChange2) != maxOTMOIChange1 and AbsValue(OTMCallOIChange2) != maxOTMOIChange2 then AbsValue(OTMCallOIChange2) else 0),
    if AbsValue(OTMCallOIChange3) != maxOTMOIChange1 and AbsValue(OTMCallOIChange3) != maxOTMOIChange2 then AbsValue(OTMCallOIChange3) else 0),
    if AbsValue(OTMCallOIChange4) != maxOTMOIChange1 and AbsValue(OTMCallOIChange4) != maxOTMOIChange2 then AbsValue(OTMCallOIChange4) else 0),
    if AbsValue(OTMCallOIChange5) != maxOTMOIChange1 and AbsValue(OTMCallOIChange5) != maxOTMOIChange2 then AbsValue(OTMCallOIChange5) else 0),
    if AbsValue(OTMCallOIChange6) != maxOTMOIChange1 and AbsValue(OTMCallOIChange6) != maxOTMOIChange2 then AbsValue(OTMCallOIChange6) else 0),
    if AbsValue(OTMCallOIChange7) != maxOTMOIChange1 and AbsValue(OTMCallOIChange7) != maxOTMOIChange2 then AbsValue(OTMCallOIChange7) else 0),
    if AbsValue(OTMCallOIChange8) != maxOTMOIChange1 and AbsValue(OTMCallOIChange8) != maxOTMOIChange2 then AbsValue(OTMCallOIChange8) else 0),
    if AbsValue(OTMCallOIChange9) != maxOTMOIChange1 and AbsValue(OTMCallOIChange9) != maxOTMOIChange2 then AbsValue(OTMCallOIChange9) else 0),
    if AbsValue(OTMCallOIChange10) != maxOTMOIChange1 and AbsValue(OTMCallOIChange10) != maxOTMOIChange2 then AbsValue(OTMCallOIChange10) else 0),
    if AbsValue(OTMCallOIChange11) != maxOTMOIChange1 and AbsValue(OTMCallOIChange11) != maxOTMOIChange2 then AbsValue(OTMCallOIChange11) else 0),
    if AbsValue(OTMCallOIChange12) != maxOTMOIChange1 and AbsValue(OTMCallOIChange12) != maxOTMOIChange2 then AbsValue(OTMCallOIChange12) else 0),
    if AbsValue(OTMCallOIChange13) != maxOTMOIChange1 and AbsValue(OTMCallOIChange13) != maxOTMOIChange2 then AbsValue(OTMCallOIChange13) else 0),
    if AbsValue(OTMCallOIChange14) != maxOTMOIChange1 and AbsValue(OTMCallOIChange14) != maxOTMOIChange2 then AbsValue(OTMCallOIChange14) else 0),
    if AbsValue(OTMCallOIChange15) != maxOTMOIChange1 and AbsValue(OTMCallOIChange15) != maxOTMOIChange2 then AbsValue(OTMCallOIChange15) else 0),
    if AbsValue(OTMCallOIChange16) != maxOTMOIChange1 and AbsValue(OTMCallOIChange16) != maxOTMOIChange2 then AbsValue(OTMCallOIChange16) else 0),
    if AbsValue(OTMCallOIChange17) != maxOTMOIChange1 and AbsValue(OTMCallOIChange17) != maxOTMOIChange2 then AbsValue(OTMCallOIChange17) else 0),
    if AbsValue(OTMCallOIChange18) != maxOTMOIChange1 and AbsValue(OTMCallOIChange18) != maxOTMOIChange2 then AbsValue(OTMCallOIChange18) else 0),
    if AbsValue(OTMCallOIChange19) != maxOTMOIChange1 and AbsValue(OTMCallOIChange19) != maxOTMOIChange2 then AbsValue(OTMCallOIChange19) else 0),
    if AbsValue(OTMCallOIChange20) != maxOTMOIChange1 and AbsValue(OTMCallOIChange20) != maxOTMOIChange2 then AbsValue(OTMCallOIChange20) else 0),
    if AbsValue(OTMCallOIChange21) != maxOTMOIChange1 and AbsValue(OTMCallOIChange21) != maxOTMOIChange2 then AbsValue(OTMCallOIChange21) else 0),
    if AbsValue(OTMCallOIChange22) != maxOTMOIChange1 and AbsValue(OTMCallOIChange22) != maxOTMOIChange2 then AbsValue(OTMCallOIChange22) else 0),
    if AbsValue(OTMCallOIChange23) != maxOTMOIChange1 and AbsValue(OTMCallOIChange23) != maxOTMOIChange2 then AbsValue(OTMCallOIChange23) else 0),
    if AbsValue(OTMCallOIChange24) != maxOTMOIChange1 and AbsValue(OTMCallOIChange24) != maxOTMOIChange2 then AbsValue(OTMCallOIChange24) else 0),
    if AbsValue(OTMCallOIChange25) != maxOTMOIChange1 and AbsValue(OTMCallOIChange25) != maxOTMOIChange2 then AbsValue(OTMCallOIChange25) else 0);

# Identifying which strike corresponds to maxOIChange3
def strikeOTMMax3 = 
    if AbsValue(OTMCallOIChange1) == maxOTMOIChange3 then callOTMstrike1
    else if AbsValue(OTMCallOIChange2) == maxOTMOIChange3 then callOTMstrike2
    else if AbsValue(OTMCallOIChange3) == maxOTMOIChange3 then callOTMstrike3
    else if AbsValue(OTMCallOIChange4) == maxOTMOIChange3 then callOTMstrike4
    else if AbsValue(OTMCallOIChange5) == maxOTMOIChange3 then callOTMstrike5
    else if AbsValue(OTMCallOIChange6) == maxOTMOIChange3 then callOTMstrike6
    else if AbsValue(OTMCallOIChange7) == maxOTMOIChange3 then callOTMstrike7
    else if AbsValue(OTMCallOIChange8) == maxOTMOIChange3 then callOTMstrike8
    else if AbsValue(OTMCallOIChange9) == maxOTMOIChange3 then callOTMstrike9
    else if AbsValue(OTMCallOIChange10) == maxOTMOIChange3 then callOTMstrike10
    else if AbsValue(OTMCallOIChange11) == maxOTMOIChange3 then callOTMstrike11
    else if AbsValue(OTMCallOIChange12) == maxOTMOIChange3 then callOTMstrike12
    else if AbsValue(OTMCallOIChange13) == maxOTMOIChange3 then callOTMstrike13
    else if AbsValue(OTMCallOIChange14) == maxOTMOIChange3 then callOTMstrike14
    else if AbsValue(OTMCallOIChange15) == maxOTMOIChange3 then callOTMstrike15
    else if AbsValue(OTMCallOIChange16) == maxOTMOIChange3 then callOTMstrike16
    else if AbsValue(OTMCallOIChange17) == maxOTMOIChange3 then callOTMstrike17
    else if AbsValue(OTMCallOIChange18) == maxOTMOIChange3 then callOTMstrike18
    else if AbsValue(OTMCallOIChange19) == maxOTMOIChange3 then callOTMstrike19
    else if AbsValue(OTMCallOIChange20) == maxOTMOIChange3 then callOTMstrike20
    else if AbsValue(OTMCallOIChange21) == maxOTMOIChange3 then callOTMstrike21
    else if AbsValue(OTMCallOIChange22) == maxOTMOIChange3 then callOTMstrike22
    else if AbsValue(OTMCallOIChange23) == maxOTMOIChange3 then callOTMstrike23
    else if AbsValue(OTMCallOIChange24) == maxOTMOIChange3 then callOTMstrike24
    else callOTMstrike25;

###########################################################################################################################
#########################################  PLOTS  #########################################################################

# HIGHEST Change Strike - ITM
plot strikeLineITMMax1 = if displaySession then strikeITMMax1 else Double.NaN;
strikeLineITMMax1.SetPaintingStrategy(PaintingStrategy.HORIZONTAL);
strikeLineITMMax1.SetDefaultColor(Color.GREEN);
strikeLineITMMax1.SetLineWeight(1);

# SECOND HIGHEST Change Strike - ITM
plot strikeLineITMMax2 = if displaySession then strikeITMMax2 else Double.NaN;
strikeLineITMMax2.SetPaintingStrategy(PaintingStrategy.HORIZONTAL);
strikeLineITMMax2.SetDefaultColor(Color.GREEN);
strikeLineITMMax2.SetLineWeight(1);

# THIRD HIGHEST Change Strike - ITM
plot strikeLineITMMax3 = if displaySession then strikeITMMax3 else Double.NaN;
strikeLineITMMax3.SetPaintingStrategy(PaintingStrategy.HORIZONTAL);
strikeLineITMMax3.SetDefaultColor(Color.GREEN);
strikeLineITMMax3.SetLineWeight(1);

# HIGHEST Change Strike - OTM
plot strikeLineOTMMax1 = if displaySession then strikeOTMMax1 else Double.NaN;
strikeLineOTMMax1.SetPaintingStrategy(PaintingStrategy.HORIZONTAL);
strikeLineOTMMax1.SetDefaultColor(Color.GREEN);
strikeLineOTMMax1.SetLineWeight(1);

# SECOND HIGHEST Change Strike - OTM
plot strikeLineOTMMax2 = if displaySession then strikeOTMMax2 else Double.NaN;
strikeLineOTMMax2.SetPaintingStrategy(PaintingStrategy.HORIZONTAL);
strikeLineOTMMax2.SetDefaultColor(Color.GREEN);
strikeLineOTMMax2.SetLineWeight(1);

# THIRD HIGHEST Change Strike - OTM
plot strikeLineOTMMax3 = if displaySession then strikeOTMMax3 else Double.NaN;
strikeLineOTMMax3.SetPaintingStrategy(PaintingStrategy.HORIZONTAL);
strikeLineOTMMax3.SetDefaultColor(Color.GREEN);
strikeLineOTMMax3.SetLineWeight(1);

###########################################################################################################################
#########################################  LABELS  ########################################################################
AddLabel(showLabels, "Exp: " + 
(if expirationMonth == 1 then "JAN"
else if expirationMonth == 2 then "FEB"
else if expirationMonth == 3 then "MAR"
else if expirationMonth == 4 then "APR"
else if expirationMonth == 5 then "MAY"
else if expirationMonth == 6 then "JUN"
else if expirationMonth == 7 then "JUL"
else if expirationMonth == 8 then "AUG"
else if expirationMonth == 9 then "SEP"
else if expirationMonth == 10 then "OCT"
else if expirationMonth == 11 then "NOV"
else "DEC") + " " + AsPrice(expirationDay) + "||" + "CALL", CreateColor(153, 153, 255));
AddLabel(showLabels, symbol + suffix + ": " + AsPrice(lastPrice) + " ", CreateColor(153, 153, 255));
AddLabel(showLabels, "ATM: " + AsPrice(closeATM) + " ", Color.WHITE);
AddLabel(showLabels,  if !IsNaN(userK) and userK != 0 then "Manual: " + AsPrice(userK) + " " else "OpenATM: " + AsPrice(openATM)+ " ", 
    Color.WHITE);

###########################################################################################################################
#########################################  BUBBLES  ########################################################################
def realOIChangeITMMax1 = OIChange(symbol, suffix, expirationDate, "C", strikeITMMax1).oic;
def realOIChangeITMMax2 = OIChange(symbol, suffix, expirationDate, "C", strikeITMMax2).oic;
def realOIChangeITMMax3 = OIChange(symbol, suffix, expirationDate, "C", strikeITMMax3).oic;
def realOIChangeOTMMax1 = OIChange(symbol, suffix, expirationDate, "C", strikeOTMMax1).oic;
def realOIChangeOTMMax2 = OIChange(symbol, suffix, expirationDate, "C", strikeOTMMax2).oic;
def realOIChangeOTMMax3 = OIChange(symbol, suffix, expirationDate, "C", strikeOTMMax3).oic;
def realOIChangeATM = OIChange(symbol, suffix, expirationDate, "C", openATM).oic;

# Define the last bar and calculate the position for bubbles
def lastbar = HighestAll(if !IsNaN(close) then BarNumber() else Double.NaN);
def shift_line_right = bubbleOffset; # Adjust this value to control the distance into the expansion area

# ITM Top 3 Bubbles
AddChartBubble(BarNumber() == lastbar + shift_line_right, strikeITMMax1, AsPrice(strikeITMMax1) + "C:" + AsPrice(realOIChangeITMMax1), if realOIChangeITMMax1 > 0 then Color.LIGHT_GREEN else Color.PINK, yes);
AddChartBubble(BarNumber() == lastbar + shift_line_right+5, strikeITMMax2, AsPrice(strikeITMMax2) + "C:" + AsPrice(realOIChangeITMMax2), if realOIChangeITMMax2 > 0 then Color.LIGHT_GREEN else Color.PINK, yes);
AddChartBubble(BarNumber() == lastbar + shift_line_right+10, strikeITMMax3, AsPrice(strikeITMMax3) + "C:" + AsPrice(realOIChangeITMMax3), if realOIChangeITMMax3 > 0 then Color.LIGHT_GREEN else Color.PINK, yes);

# ATM Change Bubble
AddChartBubble(BarNumber() == lastbar + shift_line_right + 10, openATM, AsPrice(openATM) + "C:" + AsPrice(realOIChangeATM), if realOIChangeATM > 0 then Color.LIGHT_GREEN else Color.PINK, yes);

# OTM Top 3 Bubbles
AddChartBubble(BarNumber() == lastbar + shift_line_right, strikeOTMMax1, AsPrice(strikeOTMMax1) + "C:" + AsPrice(realOIChangeOTMMax1), if realOIChangeOTMMax1 > 0 then Color.LIGHT_GREEN else Color.PINK, yes);
AddChartBubble(BarNumber() == lastbar + shift_line_right + 5, strikeOTMMax2, AsPrice(strikeOTMMax2) + "C:" + AsPrice(realOIChangeOTMMax2), if realOIChangeOTMMax2 > 0 then Color.LIGHT_GREEN else Color.PINK, yes);
AddChartBubble(BarNumber() == lastbar + shift_line_right + 10, strikeOTMMax3, AsPrice(strikeOTMMax3) + "C:" + AsPrice(realOIChangeOTMMax3), if realOIChangeOTMMax3 > 0 then Color.LIGHT_GREEN else Color.PINK, yes);

###########################################################################################################################

#AddLabel(yes,open_interest(".spx231215C4600", aggregationPeriod.DAY), color.white);
#AddLabel(yes,open_interest(".spx231215C4600", aggregationPeriod.DAY)[1], color.white);

#AddLabel(yes,yesterdayOpen,color.white); #needs 2 additional days to show
