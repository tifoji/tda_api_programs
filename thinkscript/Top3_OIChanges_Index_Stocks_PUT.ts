# ----------------------------------------------------------------------------------------------------------------------------
# tifoji@github
# v1 - Initial version to be tested across timeframes for accuracy and performance. 
# ----------------------------------------------------------------------------------------------------------------------------

declare upper;
declare real_size;
declare once_per_bar;

input symbol = "SPX";
input suffix = "";
input ITMP = 10; #hint ITMP: Max number of strikes itm. Max 10
input OTMP = 25; #hint OTMP: Max number of strikes otm. Max 125
input strike_price_interval = 5; # Increment to adjust strike price
#input useOpenATM = yes; # Default to OpenATM
input userK = 0; # Empty input for manual ATM strike
input useManualExpiration = yes;
input manualExpirationDate = 231215; # Manual expiration date if set to yes
input additionalDaysToPlot = 0 ;
input showLabels = no;
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

# ITM Put Strikes
#def putITMstrike1 = if displaySession and ITMP >= 1 then AtmStrike + strike_price_interval * 1 else 0;
def putITMstrike1 = if  ITMP >= 1 then AtmStrike + strike_price_interval * 1 else Double.NaN;
def putITMstrike2 = if  ITMP >= 2 then AtmStrike + strike_price_interval * 2 else Double.NaN;
def putITMstrike3 = if  ITMP >= 3 then AtmStrike + strike_price_interval * 3 else Double.NaN;
def putITMstrike4 = if  ITMP >= 4 then AtmStrike + strike_price_interval * 4 else Double.NaN;
def putITMstrike5 = if  ITMP >= 5 then AtmStrike + strike_price_interval * 5 else Double.NaN;
def putITMstrike6 = if  ITMP >= 6 then AtmStrike + strike_price_interval * 6 else Double.NaN;
def putITMstrike7 = if  ITMP >= 7 then AtmStrike + strike_price_interval * 7 else Double.NaN;
def putITMstrike8 = if  ITMP >= 8 then AtmStrike + strike_price_interval * 8 else Double.NaN;
def putITMstrike9 = if  ITMP >= 9 then AtmStrike + strike_price_interval * 9 else Double.NaN;
def putITMstrike10 = if ITMP >= 10 then AtmStrike + strike_price_interval * 10 else Double.NaN;

# OTM Put Strikes
def putOTMstrike1 = if OTMP >= 1 then AtmStrike - strike_price_interval * 1 else Double.NaN;
def putOTMstrike2 = if OTMP >= 2 then AtmStrike - strike_price_interval * 2 else Double.NaN;
def putOTMstrike3 = if OTMP >= 3 then AtmStrike - strike_price_interval * 3 else Double.NaN;
def putOTMstrike4 = if OTMP >= 4 then AtmStrike - strike_price_interval * 4 else Double.NaN;
def putOTMstrike5 = if OTMP >= 5 then AtmStrike - strike_price_interval * 5 else Double.NaN;
def putOTMstrike6 = if OTMP >= 6 then AtmStrike - strike_price_interval * 6 else Double.NaN;
def putOTMstrike7 = if OTMP >= 7 then AtmStrike - strike_price_interval * 7 else Double.NaN;
def putOTMstrike8 = if OTMP >= 8 then AtmStrike - strike_price_interval * 8 else Double.NaN;
def putOTMstrike9 = if OTMP >= 9 then AtmStrike - strike_price_interval * 9 else Double.NaN;
def putOTMstrike10 = if OTMP >= 10 then AtmStrike - strike_price_interval * 10 else Double.NaN;
def putOTMstrike11 = if OTMP >= 11 then AtmStrike - strike_price_interval * 11 else Double.NaN;
def putOTMstrike12 = if OTMP >= 12 then AtmStrike - strike_price_interval * 12 else Double.NaN;
def putOTMstrike13 = if OTMP >= 13 then AtmStrike - strike_price_interval * 13 else Double.NaN;
def putOTMstrike14 = if OTMP >= 14 then AtmStrike - strike_price_interval * 14 else Double.NaN;
def putOTMstrike15 = if OTMP >= 15 then AtmStrike - strike_price_interval * 15 else Double.NaN;
def putOTMstrike16 = if OTMP >= 16 then AtmStrike - strike_price_interval * 16 else Double.NaN;
def putOTMstrike17 = if OTMP >= 17 then AtmStrike - strike_price_interval * 17 else Double.NaN;
def putOTMstrike18 = if OTMP >= 18 then AtmStrike - strike_price_interval * 18 else Double.NaN;
def putOTMstrike19 = if OTMP >= 19 then AtmStrike - strike_price_interval * 19 else Double.NaN;
def putOTMstrike20 = if OTMP >= 20 then AtmStrike - strike_price_interval * 20 else Double.NaN;
def putOTMstrike21 = if OTMP >= 21 then AtmStrike - strike_price_interval * 21 else Double.NaN;
def putOTMstrike22 = if OTMP >= 22 then AtmStrike - strike_price_interval * 22 else Double.NaN;
def putOTMstrike23 = if OTMP >= 23 then AtmStrike - strike_price_interval * 23 else Double.NaN;
def putOTMstrike24 = if OTMP >= 24 then AtmStrike - strike_price_interval * 24 else Double.NaN;
def putOTMstrike25 = if OTMP >= 25 then AtmStrike - strike_price_interval * 25 else Double.NaN;

###########################################################################################################################
#########################################  ITM OI CHANGES  ################################################################
def ITMPutOIChange1 = OIChange(symbol, suffix, expirationDate, "P", putITMstrike1).oic;
def ITMPutOIChange2 = OIChange(symbol, suffix, expirationDate, "P", putITMstrike2).oic;
def ITMPutOIChange3 = OIChange(symbol, suffix, expirationDate, "P", putITMstrike3).oic;
def ITMPutOIChange4 = OIChange(symbol, suffix, expirationDate, "P", putITMstrike4).oic;
def ITMPutOIChange5 = OIChange(symbol, suffix, expirationDate, "P", putITMstrike5).oic;
def ITMPutOIChange6 = OIChange(symbol, suffix, expirationDate, "P", putITMstrike6).oic;
def ITMPutOIChange7 = OIChange(symbol, suffix, expirationDate, "P", putITMstrike7).oic;
def ITMPutOIChange8 = OIChange(symbol, suffix, expirationDate, "P", putITMstrike8).oic;
def ITMPutOIChange9 = OIChange(symbol, suffix, expirationDate, "P", putITMstrike9).oic;
def ITMPutOIChange10 = OIChange(symbol, suffix, expirationDate, "P", putITMstrike10).oic;

# Finding the HIGHEST OI change
def maxITMOIChange1 = Max(Max(Max(Max(Max(Max(Max(Max(Max(
    AbsValue(ITMPutOIChange1), AbsValue(ITMPutOIChange2)), 
    AbsValue(ITMPutOIChange3)), AbsValue(ITMPutOIChange4)), 
    AbsValue(ITMPutOIChange5)), AbsValue(ITMPutOIChange6)), 
    AbsValue(ITMPutOIChange7)), AbsValue(ITMPutOIChange8)), 
    AbsValue(ITMPutOIChange9)), AbsValue(ITMPutOIChange10));

# Identifying which strike corresponds to maxOIChange1
def strikeITMMax1 = 
    if AbsValue(ITMPutOIChange1) == maxITMOIChange1 then putITMstrike1 
    else if AbsValue(ITMPutOIChange2) == maxITMOIChange1 then putITMstrike2 
    else if AbsValue(ITMPutOIChange3) == maxITMOIChange1 then putITMstrike3 
    else if AbsValue(ITMPutOIChange4) == maxITMOIChange1 then putITMstrike4 
    else if AbsValue(ITMPutOIChange5) == maxITMOIChange1 then putITMstrike5 
    else if AbsValue(ITMPutOIChange6) == maxITMOIChange1 then putITMstrike6 
    else if AbsValue(ITMPutOIChange7) == maxITMOIChange1 then putITMstrike7 
    else if AbsValue(ITMPutOIChange8) == maxITMOIChange1 then putITMstrike8 
    else if AbsValue(ITMPutOIChange9) == maxITMOIChange1 then putITMstrike9 
    #else if AbsValue(ITMPutOIChange10) == maxITMOIChange1 then putITMstrike10
    #else Double.NaN;
    else putITMstrike10;

# Finding the SECOND HIGHEST OI change and its associated strike
def maxITMOIChange2 = Max(Max(Max(Max(Max(Max(Max(Max(Max(
    if AbsValue(ITMPutOIChange1) != maxITMOIChange1 then AbsValue(ITMPutOIChange1) else 0, 
    if AbsValue(ITMPutOIChange2) != maxITMOIChange1 then AbsValue(ITMPutOIChange2) else 0), 
    if AbsValue(ITMPutOIChange3) != maxITMOIChange1 then AbsValue(ITMPutOIChange3) else 0), 
    if AbsValue(ITMPutOIChange4) != maxITMOIChange1 then AbsValue(ITMPutOIChange4) else 0), 
    if AbsValue(ITMPutOIChange5) != maxITMOIChange1 then AbsValue(ITMPutOIChange5) else 0), 
    if AbsValue(ITMPutOIChange6) != maxITMOIChange1 then AbsValue(ITMPutOIChange6) else 0), 
    if AbsValue(ITMPutOIChange7) != maxITMOIChange1 then AbsValue(ITMPutOIChange7) else 0), 
    if AbsValue(ITMPutOIChange8) != maxITMOIChange1 then AbsValue(ITMPutOIChange8) else 0), 
    if AbsValue(ITMPutOIChange9) != maxITMOIChange1 then AbsValue(ITMPutOIChange9) else 0), 
    if AbsValue(ITMPutOIChange10) != maxITMOIChange1 then AbsValue(ITMPutOIChange10) else 0);

# Identifying which strike corresponds to maxOIChange2
def strikeITMMax2 = 
    if AbsValue(ITMPutOIChange1) == maxITMOIChange2 then putITMstrike1 
    else if AbsValue(ITMPutOIChange2) == maxITMOIChange2 then putITMstrike2 
    else if AbsValue(ITMPutOIChange3) == maxITMOIChange2 then putITMstrike3 
    else if AbsValue(ITMPutOIChange4) == maxITMOIChange2 then putITMstrike4 
    else if AbsValue(ITMPutOIChange5) == maxITMOIChange2 then putITMstrike5 
    else if AbsValue(ITMPutOIChange6) == maxITMOIChange2 then putITMstrike6 
    else if AbsValue(ITMPutOIChange7) == maxITMOIChange2 then putITMstrike7 
    else if AbsValue(ITMPutOIChange8) == maxITMOIChange2 then putITMstrike8 
    else if AbsValue(ITMPutOIChange9) == maxITMOIChange2 then putITMstrike9 
    else if AbsValue(ITMPutOIChange10) == maxITMOIChange2 then putITMstrike10
    else putITMstrike10;

# Finding the THIRD HIGHEST OI change and its associated strike
def maxITMOIChange3 = Max(Max(Max(Max(Max(Max(Max(Max(Max(
    if AbsValue(ITMPutOIChange1) != maxITMOIChange1 and AbsValue(ITMPutOIChange1) != maxITMOIChange2 then AbsValue(ITMPutOIChange1) else 0, 
    if AbsValue(ITMPutOIChange2) != maxITMOIChange1 and AbsValue(ITMPutOIChange2) != maxITMOIChange2 then AbsValue(ITMPutOIChange2) else 0), 
    if AbsValue(ITMPutOIChange3) != maxITMOIChange1 and AbsValue(ITMPutOIChange3) != maxITMOIChange2 then AbsValue(ITMPutOIChange3) else 0), 
    if AbsValue(ITMPutOIChange4) != maxITMOIChange1 and AbsValue(ITMPutOIChange4) != maxITMOIChange2 then AbsValue(ITMPutOIChange4) else 0), 
    if AbsValue(ITMPutOIChange5) != maxITMOIChange1 and AbsValue(ITMPutOIChange5) != maxITMOIChange2 then AbsValue(ITMPutOIChange5) else 0), 
    if AbsValue(ITMPutOIChange6) != maxITMOIChange1 and AbsValue(ITMPutOIChange6) != maxITMOIChange2 then AbsValue(ITMPutOIChange6) else 0), 
    if AbsValue(ITMPutOIChange7) != maxITMOIChange1 and AbsValue(ITMPutOIChange7) != maxITMOIChange2 then AbsValue(ITMPutOIChange7) else 0), 
    if AbsValue(ITMPutOIChange8) != maxITMOIChange1 and AbsValue(ITMPutOIChange8) != maxITMOIChange2 then AbsValue(ITMPutOIChange8) else 0), 
    if AbsValue(ITMPutOIChange9) != maxITMOIChange1 and AbsValue(ITMPutOIChange9) != maxITMOIChange2 then AbsValue(ITMPutOIChange9) else 0), 
    if AbsValue(ITMPutOIChange10) != maxITMOIChange1 and AbsValue(ITMPutOIChange10) != maxITMOIChange2 then ITMPutOIChange10 else 0);

# Identifying which strike corresponds to maxOIChange3
def strikeITMMax3 = 
    if AbsValue(ITMPutOIChange1) == maxITMOIChange3 then putITMstrike1 
    else if AbsValue(ITMPutOIChange2) == maxITMOIChange3 then putITMstrike2 
    else if AbsValue(ITMPutOIChange3) == maxITMOIChange3 then putITMstrike3 
    else if AbsValue(ITMPutOIChange4) == maxITMOIChange3 then putITMstrike4 
    else if AbsValue(ITMPutOIChange5) == maxITMOIChange3 then putITMstrike5 
    else if AbsValue(ITMPutOIChange6) == maxITMOIChange3 then putITMstrike6 
    else if AbsValue(ITMPutOIChange7) == maxITMOIChange3 then putITMstrike7 
    else if AbsValue(ITMPutOIChange8) == maxITMOIChange3 then putITMstrike8 
    else if AbsValue(ITMPutOIChange9) == maxITMOIChange3 then putITMstrike9 
    else putITMstrike10;

###########################################################################################################################
#########################################  OTM OI CHANGES  ################################################################

###OTM OI CHANGES
def OTMPutOIChange1 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike1).oic;
def OTMPutOIChange2 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike2).oic;
def OTMPutOIChange3 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike3).oic;
def OTMPutOIChange4 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike4).oic;
def OTMPutOIChange5 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike5).oic;
def OTMPutOIChange6 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike6).oic;
def OTMPutOIChange7 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike7).oic;
def OTMPutOIChange8 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike8).oic;
def OTMPutOIChange9 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike9).oic;
def OTMPutOIChange10 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike10).oic;
def OTMPutOIChange11 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike11).oic;
def OTMPutOIChange12 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike12).oic;
def OTMPutOIChange13 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike13).oic;
def OTMPutOIChange14 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike14).oic;
def OTMPutOIChange15 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike15).oic;
def OTMPutOIChange16 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike16).oic;
def OTMPutOIChange17 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike17).oic;
def OTMPutOIChange18 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike18).oic;
def OTMPutOIChange19 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike19).oic;
def OTMPutOIChange20 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike20).oic;
def OTMPutOIChange21 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike21).oic;
def OTMPutOIChange22 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike22).oic;
def OTMPutOIChange23 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike23).oic;
def OTMPutOIChange24 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike24).oic;
def OTMPutOIChange25 = OIChange(symbol, suffix, expirationDate, "P", putOTMstrike25).oic;

# Finding the HIGHEST OI change and its associated strike
def maxOTMOIChange1 = Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(
    AbsValue(OTMPutOIChange1), AbsValue(OTMPutOIChange2)), 
    AbsValue(OTMPutOIChange3)), AbsValue(OTMPutOIChange4)), 
    AbsValue(OTMPutOIChange5)), AbsValue(OTMPutOIChange6)), 
    AbsValue(OTMPutOIChange7)), AbsValue(OTMPutOIChange8)), 
    AbsValue(OTMPutOIChange9)), AbsValue(OTMPutOIChange10)),
    AbsValue(OTMPutOIChange11)), AbsValue(OTMPutOIChange12)), 
    AbsValue(OTMPutOIChange13)), AbsValue(OTMPutOIChange14)), 
    AbsValue(OTMPutOIChange15)), AbsValue(OTMPutOIChange16)), 
    AbsValue(OTMPutOIChange17)), AbsValue(OTMPutOIChange18)), 
    AbsValue(OTMPutOIChange19)), AbsValue(OTMPutOIChange20)),
    AbsValue(OTMPutOIChange21)), AbsValue(OTMPutOIChange22)), 
    AbsValue(OTMPutOIChange23)), AbsValue(OTMPutOIChange24)), 
    AbsValue(OTMPutOIChange25));

# Identifying which strike corresponds to maxOTMOIChange1
def strikeOTMMax1 = if AbsValue(OTMPutOIChange1) == maxOTMOIChange1 then putOTMstrike1 
                 else if AbsValue(OTMPutOIChange2) == maxOTMOIChange1 then putOTMstrike2 
                 else if AbsValue(OTMPutOIChange3) == maxOTMOIChange1 then putOTMstrike3 
                 else if AbsValue(OTMPutOIChange4) == maxOTMOIChange1 then putOTMstrike4 
                 else if AbsValue(OTMPutOIChange5) == maxOTMOIChange1 then putOTMstrike5 
                 else if AbsValue(OTMPutOIChange6) == maxOTMOIChange1 then putOTMstrike6 
                 else if AbsValue(OTMPutOIChange7) == maxOTMOIChange1 then putOTMstrike7 
                 else if AbsValue(OTMPutOIChange8) == maxOTMOIChange1 then putOTMstrike8 
                 else if AbsValue(OTMPutOIChange9) == maxOTMOIChange1 then putOTMstrike9
                 else if AbsValue(OTMPutOIChange10) == maxOTMOIChange1 then putOTMstrike10
                 else if AbsValue(OTMPutOIChange11) == maxOTMOIChange1 then putOTMstrike11
                 else if AbsValue(OTMPutOIChange12) == maxOTMOIChange1 then putOTMstrike12
                 else if AbsValue(OTMPutOIChange13) == maxOTMOIChange1 then putOTMstrike13
                 else if AbsValue(OTMPutOIChange14) == maxOTMOIChange1 then putOTMstrike14
                 else if AbsValue(OTMPutOIChange15) == maxOTMOIChange1 then putOTMstrike15
                 else if AbsValue(OTMPutOIChange16) == maxOTMOIChange1 then putOTMstrike16
                 else if AbsValue(OTMPutOIChange17) == maxOTMOIChange1 then putOTMstrike17
                 else if AbsValue(OTMPutOIChange18) == maxOTMOIChange1 then putOTMstrike18
                 else if AbsValue(OTMPutOIChange19) == maxOTMOIChange1 then putOTMstrike19
                 else if AbsValue(OTMPutOIChange20) == maxOTMOIChange1 then putOTMstrike20
                 else if AbsValue(OTMPutOIChange21) == maxOTMOIChange1 then putOTMstrike21
                 else if AbsValue(OTMPutOIChange22) == maxOTMOIChange1 then putOTMstrike22
                 else if AbsValue(OTMPutOIChange23) == maxOTMOIChange1 then putOTMstrike23
                 else if AbsValue(OTMPutOIChange24) == maxOTMOIChange1 then putOTMstrike24
                 #else if AbsValue(OTMPutOIChange25) == maxOTMOIChange1 then putOTMstrike25
                 #else Double.NaN;
                 else putOTMstrike25;

# Finding the SECOND HIGHEST OI change and its associated strike
def maxOTMOIChange2 = Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(
    if AbsValue(OTMPutOIChange1) != maxOTMOIChange1 then AbsValue(OTMPutOIChange1) else 0,
    if AbsValue(OTMPutOIChange2) != maxOTMOIChange1 then AbsValue(OTMPutOIChange2) else 0),
    if AbsValue(OTMPutOIChange3) != maxOTMOIChange1 then AbsValue(OTMPutOIChange3) else 0),
    if AbsValue(OTMPutOIChange4) != maxOTMOIChange1 then AbsValue(OTMPutOIChange4) else 0),
    if AbsValue(OTMPutOIChange5) != maxOTMOIChange1 then AbsValue(OTMPutOIChange5) else 0),
    if AbsValue(OTMPutOIChange6) != maxOTMOIChange1 then AbsValue(OTMPutOIChange6) else 0),
    if AbsValue(OTMPutOIChange7) != maxOTMOIChange1 then AbsValue(OTMPutOIChange7) else 0),
    if AbsValue(OTMPutOIChange8) != maxOTMOIChange1 then AbsValue(OTMPutOIChange8) else 0),
    if AbsValue(OTMPutOIChange9) != maxOTMOIChange1 then AbsValue(OTMPutOIChange9) else 0),
    if AbsValue(OTMPutOIChange10) != maxOTMOIChange1 then AbsValue(OTMPutOIChange10) else 0),
    if AbsValue(OTMPutOIChange11) != maxOTMOIChange1 then AbsValue(OTMPutOIChange11) else 0),
    if AbsValue(OTMPutOIChange12) != maxOTMOIChange1 then AbsValue(OTMPutOIChange12) else 0),
    if AbsValue(OTMPutOIChange13) != maxOTMOIChange1 then AbsValue(OTMPutOIChange13) else 0),
    if AbsValue(OTMPutOIChange14) != maxOTMOIChange1 then AbsValue(OTMPutOIChange14) else 0),
    if AbsValue(OTMPutOIChange15) != maxOTMOIChange1 then AbsValue(OTMPutOIChange15) else 0),
    if AbsValue(OTMPutOIChange16) != maxOTMOIChange1 then AbsValue(OTMPutOIChange16) else 0),
    if AbsValue(OTMPutOIChange17) != maxOTMOIChange1 then AbsValue(OTMPutOIChange17) else 0),
    if AbsValue(OTMPutOIChange18) != maxOTMOIChange1 then AbsValue(OTMPutOIChange18) else 0),
    if AbsValue(OTMPutOIChange19) != maxOTMOIChange1 then AbsValue(OTMPutOIChange19) else 0),
    if AbsValue(OTMPutOIChange20) != maxOTMOIChange1 then AbsValue(OTMPutOIChange20) else 0),
    if AbsValue(OTMPutOIChange21) != maxOTMOIChange1 then AbsValue(OTMPutOIChange21) else 0),
    if AbsValue(OTMPutOIChange22) != maxOTMOIChange1 then AbsValue(OTMPutOIChange22) else 0),
    if AbsValue(OTMPutOIChange23) != maxOTMOIChange1 then AbsValue(OTMPutOIChange23) else 0),
    if AbsValue(OTMPutOIChange24) != maxOTMOIChange1 then AbsValue(OTMPutOIChange24) else 0),
    if AbsValue(OTMPutOIChange25) != maxOTMOIChange1 then AbsValue(OTMPutOIChange25) else 0);

# Identifying which strike corresponds to maxOIChange2
def strikeOTMMax2 = 
    if AbsValue(OTMPutOIChange1) == maxOTMOIChange2 then putOTMstrike1
    else if AbsValue(OTMPutOIChange2) == maxOTMOIChange2 then putOTMstrike2
    else if AbsValue(OTMPutOIChange3) == maxOTMOIChange2 then putOTMstrike3
    else if AbsValue(OTMPutOIChange4) == maxOTMOIChange2 then putOTMstrike4
    else if AbsValue(OTMPutOIChange5) == maxOTMOIChange2 then putOTMstrike5
    else if AbsValue(OTMPutOIChange6) == maxOTMOIChange2 then putOTMstrike6
    else if AbsValue(OTMPutOIChange7) == maxOTMOIChange2 then putOTMstrike7
    else if AbsValue(OTMPutOIChange8) == maxOTMOIChange2 then putOTMstrike8
    else if AbsValue(OTMPutOIChange9) == maxOTMOIChange2 then putOTMstrike9
    else if AbsValue(OTMPutOIChange10) == maxOTMOIChange2 then putOTMstrike10
    else if AbsValue(OTMPutOIChange11) == maxOTMOIChange2 then putOTMstrike11
    else if AbsValue(OTMPutOIChange12) == maxOTMOIChange2 then putOTMstrike12
    else if AbsValue(OTMPutOIChange13) == maxOTMOIChange2 then putOTMstrike13
    else if AbsValue(OTMPutOIChange14) == maxOTMOIChange2 then putOTMstrike14
    else if AbsValue(OTMPutOIChange15) == maxOTMOIChange2 then putOTMstrike15
    else if AbsValue(OTMPutOIChange16) == maxOTMOIChange2 then putOTMstrike16
    else if AbsValue(OTMPutOIChange17) == maxOTMOIChange2 then putOTMstrike17
    else if AbsValue(OTMPutOIChange18) == maxOTMOIChange2 then putOTMstrike18
    else if AbsValue(OTMPutOIChange19) == maxOTMOIChange2 then putOTMstrike19
    else if AbsValue(OTMPutOIChange20) == maxOTMOIChange2 then putOTMstrike20
    else if AbsValue(OTMPutOIChange21) == maxOTMOIChange2 then putOTMstrike21
    else if AbsValue(OTMPutOIChange22) == maxOTMOIChange2 then putOTMstrike22
    else if AbsValue(OTMPutOIChange23) == maxOTMOIChange2 then putOTMstrike23
    else if AbsValue(OTMPutOIChange24) == maxOTMOIChange2 then putOTMstrike24
    else putOTMstrike25;

# Finding the THIRD HIGHEST OI change and its associated strike
def maxOTMOIChange3 = Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(Max(
if AbsValue(OTMPutOIChange1) != maxOTMOIChange1 and AbsValue(OTMPutOIChange1) != maxOTMOIChange2 then AbsValue(OTMPutOIChange1) else 0,
    if AbsValue(OTMPutOIChange2) != maxOTMOIChange1 and AbsValue(OTMPutOIChange2) != maxOTMOIChange2 then AbsValue(OTMPutOIChange2) else 0),
    if AbsValue(OTMPutOIChange3) != maxOTMOIChange1 and AbsValue(OTMPutOIChange3) != maxOTMOIChange2 then AbsValue(OTMPutOIChange3) else 0),
    if AbsValue(OTMPutOIChange4) != maxOTMOIChange1 and AbsValue(OTMPutOIChange4) != maxOTMOIChange2 then AbsValue(OTMPutOIChange4) else 0),
    if AbsValue(OTMPutOIChange5) != maxOTMOIChange1 and AbsValue(OTMPutOIChange5) != maxOTMOIChange2 then AbsValue(OTMPutOIChange5) else 0),
    if AbsValue(OTMPutOIChange6) != maxOTMOIChange1 and AbsValue(OTMPutOIChange6) != maxOTMOIChange2 then AbsValue(OTMPutOIChange6) else 0),
    if AbsValue(OTMPutOIChange7) != maxOTMOIChange1 and AbsValue(OTMPutOIChange7) != maxOTMOIChange2 then AbsValue(OTMPutOIChange7) else 0),
    if AbsValue(OTMPutOIChange8) != maxOTMOIChange1 and AbsValue(OTMPutOIChange8) != maxOTMOIChange2 then AbsValue(OTMPutOIChange8) else 0),
    if AbsValue(OTMPutOIChange9) != maxOTMOIChange1 and AbsValue(OTMPutOIChange9) != maxOTMOIChange2 then AbsValue(OTMPutOIChange9) else 0),
    if AbsValue(OTMPutOIChange10) != maxOTMOIChange1 and AbsValue(OTMPutOIChange10) != maxOTMOIChange2 then AbsValue(OTMPutOIChange10) else 0),
    if AbsValue(OTMPutOIChange11) != maxOTMOIChange1 and AbsValue(OTMPutOIChange11) != maxOTMOIChange2 then AbsValue(OTMPutOIChange11) else 0),
    if AbsValue(OTMPutOIChange12) != maxOTMOIChange1 and AbsValue(OTMPutOIChange12) != maxOTMOIChange2 then AbsValue(OTMPutOIChange12) else 0),
    if AbsValue(OTMPutOIChange13) != maxOTMOIChange1 and AbsValue(OTMPutOIChange13) != maxOTMOIChange2 then AbsValue(OTMPutOIChange13) else 0),
    if AbsValue(OTMPutOIChange14) != maxOTMOIChange1 and AbsValue(OTMPutOIChange14) != maxOTMOIChange2 then AbsValue(OTMPutOIChange14) else 0),
    if AbsValue(OTMPutOIChange15) != maxOTMOIChange1 and AbsValue(OTMPutOIChange15) != maxOTMOIChange2 then AbsValue(OTMPutOIChange15) else 0),
    if AbsValue(OTMPutOIChange16) != maxOTMOIChange1 and AbsValue(OTMPutOIChange16) != maxOTMOIChange2 then AbsValue(OTMPutOIChange16) else 0),
    if AbsValue(OTMPutOIChange17) != maxOTMOIChange1 and AbsValue(OTMPutOIChange17) != maxOTMOIChange2 then AbsValue(OTMPutOIChange17) else 0),
    if AbsValue(OTMPutOIChange18) != maxOTMOIChange1 and AbsValue(OTMPutOIChange18) != maxOTMOIChange2 then AbsValue(OTMPutOIChange18) else 0),
    if AbsValue(OTMPutOIChange19) != maxOTMOIChange1 and AbsValue(OTMPutOIChange19) != maxOTMOIChange2 then AbsValue(OTMPutOIChange19) else 0),
    if AbsValue(OTMPutOIChange20) != maxOTMOIChange1 and AbsValue(OTMPutOIChange20) != maxOTMOIChange2 then AbsValue(OTMPutOIChange20) else 0),
    if AbsValue(OTMPutOIChange21) != maxOTMOIChange1 and AbsValue(OTMPutOIChange21) != maxOTMOIChange2 then AbsValue(OTMPutOIChange21) else 0),
    if AbsValue(OTMPutOIChange22) != maxOTMOIChange1 and AbsValue(OTMPutOIChange22) != maxOTMOIChange2 then AbsValue(OTMPutOIChange22) else 0),
    if AbsValue(OTMPutOIChange23) != maxOTMOIChange1 and AbsValue(OTMPutOIChange23) != maxOTMOIChange2 then AbsValue(OTMPutOIChange23) else 0),
    if AbsValue(OTMPutOIChange24) != maxOTMOIChange1 and AbsValue(OTMPutOIChange24) != maxOTMOIChange2 then AbsValue(OTMPutOIChange24) else 0),
    if AbsValue(OTMPutOIChange25) != maxOTMOIChange1 and AbsValue(OTMPutOIChange25) != maxOTMOIChange2 then AbsValue(OTMPutOIChange25) else 0);

# Identifying which strike corresponds to maxOIChange3
def strikeOTMMax3 = 
    if AbsValue(OTMPutOIChange1) == maxOTMOIChange3 then putOTMstrike1
    else if AbsValue(OTMPutOIChange2) == maxOTMOIChange3 then putOTMstrike2
    else if AbsValue(OTMPutOIChange3) == maxOTMOIChange3 then putOTMstrike3
    else if AbsValue(OTMPutOIChange4) == maxOTMOIChange3 then putOTMstrike4
    else if AbsValue(OTMPutOIChange5) == maxOTMOIChange3 then putOTMstrike5
    else if AbsValue(OTMPutOIChange6) == maxOTMOIChange3 then putOTMstrike6
    else if AbsValue(OTMPutOIChange7) == maxOTMOIChange3 then putOTMstrike7
    else if AbsValue(OTMPutOIChange8) == maxOTMOIChange3 then putOTMstrike8
    else if AbsValue(OTMPutOIChange9) == maxOTMOIChange3 then putOTMstrike9
    else if AbsValue(OTMPutOIChange10) == maxOTMOIChange3 then putOTMstrike10
    else if AbsValue(OTMPutOIChange11) == maxOTMOIChange3 then putOTMstrike11
    else if AbsValue(OTMPutOIChange12) == maxOTMOIChange3 then putOTMstrike12
    else if AbsValue(OTMPutOIChange13) == maxOTMOIChange3 then putOTMstrike13
    else if AbsValue(OTMPutOIChange14) == maxOTMOIChange3 then putOTMstrike14
    else if AbsValue(OTMPutOIChange15) == maxOTMOIChange3 then putOTMstrike15
    else if AbsValue(OTMPutOIChange16) == maxOTMOIChange3 then putOTMstrike16
    else if AbsValue(OTMPutOIChange17) == maxOTMOIChange3 then putOTMstrike17
    else if AbsValue(OTMPutOIChange18) == maxOTMOIChange3 then putOTMstrike18
    else if AbsValue(OTMPutOIChange19) == maxOTMOIChange3 then putOTMstrike19
    else if AbsValue(OTMPutOIChange20) == maxOTMOIChange3 then putOTMstrike20
    else if AbsValue(OTMPutOIChange21) == maxOTMOIChange3 then putOTMstrike21
    else if AbsValue(OTMPutOIChange22) == maxOTMOIChange3 then putOTMstrike22
    else if AbsValue(OTMPutOIChange23) == maxOTMOIChange3 then putOTMstrike23
    else if AbsValue(OTMPutOIChange24) == maxOTMOIChange3 then putOTMstrike24
    else putOTMstrike25;

###########################################################################################################################
#########################################  PLOTS  #########################################################################

# HIGHEST Change Strike - ITM
plot strikeLineITMMax1 = if displaySession then strikeITMMax1 else Double.NaN;
strikeLineITMMax1.SetPaintingStrategy(PaintingStrategy.HORIZONTAL);
strikeLineITMMax1.SetDefaultColor(Color.RED);
strikeLineITMMax1.SetLineWeight(1);

# SECOND HIGHEST Change Strike - ITM
plot strikeLineITMMax2 = if displaySession then strikeITMMax2 else Double.NaN;
strikeLineITMMax2.SetPaintingStrategy(PaintingStrategy.HORIZONTAL);
strikeLineITMMax2.SetDefaultColor(Color.RED);
strikeLineITMMax2.SetLineWeight(1);

# THIRD HIGHEST Change Strike - ITM
plot strikeLineITMMax3 = if displaySession then strikeITMMax3 else Double.NaN;
strikeLineITMMax3.SetPaintingStrategy(PaintingStrategy.HORIZONTAL);
strikeLineITMMax3.SetDefaultColor(Color.RED);
strikeLineITMMax3.SetLineWeight(1);

# HIGHEST Change Strike - OTM
plot strikeLineOTMMax1 = if displaySession then strikeOTMMax1 else Double.NaN;
strikeLineOTMMax1.SetPaintingStrategy(PaintingStrategy.HORIZONTAL);
strikeLineOTMMax1.SetDefaultColor(Color.RED);
strikeLineOTMMax1.SetLineWeight(1);

# SECOND HIGHEST Change Strike - OTM
plot strikeLineOTMMax2 = if displaySession then strikeOTMMax2 else Double.NaN;
strikeLineOTMMax2.SetPaintingStrategy(PaintingStrategy.HORIZONTAL);
strikeLineOTMMax2.SetDefaultColor(Color.RED);
strikeLineOTMMax2.SetLineWeight(1);

# THIRD HIGHEST Change Strike - OTM
plot strikeLineOTMMax3 = if displaySession then strikeOTMMax3 else Double.NaN;
strikeLineOTMMax3.SetPaintingStrategy(PaintingStrategy.HORIZONTAL);
strikeLineOTMMax3.SetDefaultColor(Color.RED);
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
def realOIChangeITMMax1 = OIChange(symbol, suffix, expirationDate, "P", strikeITMMax1).oic;
def realOIChangeITMMax2 = OIChange(symbol, suffix, expirationDate, "P", strikeITMMax2).oic;
def realOIChangeITMMax3 = OIChange(symbol, suffix, expirationDate, "P", strikeITMMax3).oic;
def realOIChangeOTMMax1 = OIChange(symbol, suffix, expirationDate, "P", strikeOTMMax1).oic;
def realOIChangeOTMMax2 = OIChange(symbol, suffix, expirationDate, "P", strikeOTMMax2).oic;
def realOIChangeOTMMax3 = OIChange(symbol, suffix, expirationDate, "P", strikeOTMMax3).oic;
def realOIChangeATM = OIChange(symbol, suffix, expirationDate, "P", openATM).oic;

# Define the last bar and calculate the position for bubbles
def lastbar = HighestAll(if !IsNaN(close) then BarNumber() else Double.NaN);
def shift_line_right = bubbleOffset; # Adjust this value to control the distance into the expansion area

# ITM Top 3 Bubbles
AddChartBubble(BarNumber() == lastbar + shift_line_right + 20, strikeITMMax1, AsPrice(strikeITMMax1) + "P:" + AsPrice(realOIChangeITMMax1), if realOIChangeITMMax1 > 0 then Color.LIGHT_GREEN else Color.PINK, yes);
AddChartBubble(BarNumber() == lastbar + shift_line_right+20, strikeITMMax2, AsPrice(strikeITMMax2) + "P:" + AsPrice(realOIChangeITMMax2), if realOIChangeITMMax2 > 0 then Color.LIGHT_GREEN else Color.PINK, yes);
AddChartBubble(BarNumber() == lastbar + shift_line_right+20, strikeITMMax3, AsPrice(strikeITMMax3) + "P:" + AsPrice(realOIChangeITMMax3), if realOIChangeITMMax3 > 0 then Color.LIGHT_GREEN else Color.PINK, yes);

# ATM Change Bubble
AddChartBubble(BarNumber() == lastbar + shift_line_right + 10, openATM, AsPrice(openATM) + "P:" + AsPrice(realOIChangeATM), if realOIChangeATM > 0 then Color.LIGHT_GREEN else Color.PINK, yes);

# OTM Top 3 Bubbles
AddChartBubble(BarNumber() == lastbar + shift_line_right + 20, strikeOTMMax1, AsPrice(strikeOTMMax1) + "P:" + AsPrice(realOIChangeOTMMax1), if realOIChangeOTMMax1 > 0 then Color.LIGHT_GREEN else Color.PINK, yes);
AddChartBubble(BarNumber() == lastbar + shift_line_right + 20, strikeOTMMax2, AsPrice(strikeOTMMax2) + "P:" + AsPrice(realOIChangeOTMMax2), if realOIChangeOTMMax2 > 0 then Color.LIGHT_GREEN else Color.PINK, yes);
AddChartBubble(BarNumber() == lastbar + shift_line_right + 20, strikeOTMMax3, AsPrice(strikeOTMMax3) + "P:" + AsPrice(realOIChangeOTMMax3), if realOIChangeOTMMax3 > 0 then Color.LIGHT_GREEN else Color.PINK, yes);

###########################################################################################################################

#AddLabel(yes,open_interest(".spx231215C4600", aggregationPeriod.DAY), color.white);
#AddLabel(yes,open_interest(".spx231215C4600", aggregationPeriod.DAY)[1], color.white);

#AddLabel(yes,yesterdayOpen,color.white);
